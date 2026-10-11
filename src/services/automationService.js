import { getDb } from '../db/database.js';
import { generateId } from './cryptoService.js';
import { profileOptimizerService } from './profileOptimizerService.js';
import { linkedinIntegrationAdapter } from './linkedinIntegrationAdapter.js';

export class AutomationService {
  getJobs(userId) {
    const db = getDb();
    let jobs = db.prepare('SELECT * FROM automation_jobs WHERE user_id = ?').all(userId);
    if (jobs.length === 0) {
      this.ensureDefaultJobs(userId);
      jobs = db.prepare('SELECT * FROM automation_jobs WHERE user_id = ?').all(userId);
    }
    return jobs.map((j) => ({
      ...j,
      metadata: JSON.parse(j.metadata_json || '{}')
    }));
  }

  ensureDefaultJobs(userId) {
    const db = getDb();
    const defaults = [
      {
        type: 'scheduled_audit',
        schedule: 'weekly',
        metadata: { dayOfWeek: 'Monday' }
      },
      {
        type: 'profile_freshness_reminder',
        schedule: 'monthly',
        metadata: { thresholdDays: 30 }
      },
      {
        type: 'draft_generation',
        schedule: 'biweekly',
        metadata: { targetTopic: 'Engineering Insights' }
      }
    ];

    const now = new Date().toISOString();
    for (const d of defaults) {
      const existing = db
        .prepare('SELECT id FROM automation_jobs WHERE user_id = ? AND job_type = ?')
        .get(userId, d.type);
      if (!existing) {
        db.prepare(
          `INSERT INTO automation_jobs
           (id, user_id, job_type, status, schedule, next_run_at, metadata_json, created_at)
           VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`
        ).run(
          generateId(),
          userId,
          d.type,
          d.schedule,
          new Date(Date.now() + 86400000).toISOString(),
          JSON.stringify(d.metadata),
          now
        );
      }
    }
  }

  toggleJobStatus(userId, jobId, newStatus) {
    const db = getDb();
    const allowed = ['active', 'paused'];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const job = db.prepare('SELECT * FROM automation_jobs WHERE id = ? AND user_id = ?').get(jobId, userId);
    if (!job) {
      throw new Error('Automation job not found');
    }

    db.prepare('UPDATE automation_jobs SET status = ? WHERE id = ? AND user_id = ?').run(
      newStatus,
      jobId,
      userId
    );

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, 'automation_job_toggle', 'success', ?, ?)`
    ).run(generateId(), userId, JSON.stringify({ jobId, jobType: job.job_type, newStatus }), now);

    return { jobId, status: newStatus };
  }

  checkFreshnessReminders(userId) {
    const profile = profileOptimizerService.getProfile(userId);
    const reminders = [];
    const now = Date.now();
    const profileUpdated = new Date(profile.updatedAt).getTime();
    const diffDays = Math.floor((now - profileUpdated) / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      reminders.push({
        section: 'Profile Freshness',
        daysSinceUpdate: diffDays,
        message: `Your profile has not been updated in ${diffDays} days. Review current projects and new skills.`
      });
    }

    const exp = profile.experience || [];
    const currentRole = exp.find((e) => e.is_current);
    if (currentRole && (!currentRole.achievements_metrics || currentRole.achievements_metrics.length === 0)) {
      reminders.push({
        section: 'Experience Metrics',
        daysSinceUpdate: 0,
        message: `Add recent achievements and metrics for your current position at ${currentRole.company || 'your organization'}.`
      });
    }

    const skills = profile.skills || [];
    if (skills.length < 8) {
      reminders.push({
        section: 'Skills Expansion',
        daysSinceUpdate: 0,
        message: 'Add more domain tools, platforms, and methodologies to maintain search visibility.'
      });
    }

    return reminders;
  }

  createPostDraft(userId, { topic, content, scheduled_for = null }) {
    const db = getDb();
    const id = generateId();
    const idempotencyKey = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO post_drafts
       (id, user_id, topic, content, status, idempotency_key, scheduled_for, created_at)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`
    ).run(id, userId, topic, content, idempotencyKey, scheduled_for, now);

    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, 'post_draft_created', 'success', ?, ?)`
    ).run(generateId(), userId, JSON.stringify({ draftId: id, topic }), now);

    return {
      id,
      topic,
      content,
      status: 'draft',
      idempotencyKey,
      scheduled_for,
      createdAt: now
    };
  }

  generateProfessionalPostDraft(userId, topicCategory = 'Technical Learning') {
    const profile = profileOptimizerService.getProfile(userId);
    const topSkills = (profile.skills || []).slice(0, 3).join(', ') || 'software engineering';
    const role = profile.targetRole || 'Software Engineer';
    const lang = profile.language || 'id';

    let content = '';
    let title = '';

    if (lang === 'id') {
      title = `Catatan Rekayasa: Menerapkan ${topSkills}`;
      content = `Dalam perjalanan rekayasa perangkat lunak, menjaga kualitas sistem memerlukan disiplin pada detail implementasi dan pengujian terarah.\n\nMinggu ini saya meninjau kembali pendekatan arsitektur untuk ${topSkills}. Beberapa prinsip yang terbukti efektif di lingkungan kerja nyata:\n\n1. Sederhanakan alur data sebelum melakukan optimasi performa.\n2. Jadikan pengujian otomatis sebagai bagian tak terpisahkan dari siklus pull request.\n3. Dokumentasikan batasan sistem secara jujur agar tim dapat mengambil keputusan berbasis konteks yang tepat.\n\nBagaimana rekan-rekan menangani standardisasi kualitas kode dalam tim Anda? Terbuka untuk bertukar perspektif.`;
    } else {
      title = `Engineering Notes: Working with ${topSkills}`;
      content = `In day-to-day software engineering, system reliability depends on clear architectural boundaries and focused automated testing.\n\nReflecting on recent work with ${topSkills}, three practical principles consistently hold true:\n\n1. Simplify data flow before attempting premature optimization.\n2. Treat automated regression tests as a core part of each pull request.\n3. Document system limitations transparently so teams make well-informed trade-offs.\n\nHow does your team approach code quality and architectural consistency? Interested in hearing your perspectives.`;
    }

    return this.createPostDraft(userId, { topic: title, content });
  }

  getDrafts(userId) {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM post_drafts WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId);
    return rows;
  }

  async processDraftApproval(userId, draftId, { approve, publish_to_linkedin = false }) {
    const db = getDb();
    const draft = db
      .prepare('SELECT * FROM post_drafts WHERE id = ? AND user_id = ?')
      .get(draftId, userId);

    if (!draft) {
      throw new Error('Draft not found');
    }

    const now = new Date().toISOString();

    if (!approve) {
      db.prepare('UPDATE post_drafts SET status = ? WHERE id = ?').run('rejected', draftId);
      db.prepare(
        `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
         VALUES (?, ?, 'post_draft_rejected', 'success', ?, ?)`
      ).run(generateId(), userId, JSON.stringify({ draftId }), now);
      return { draftId, status: 'rejected' };
    }

    if (publish_to_linkedin) {
      const shareResult = await linkedinIntegrationAdapter.publishPost(userId, {
        text: draft.content,
        idempotencyKey: draft.idempotency_key,
        userApproved: true
      });
      return {
        draftId,
        status: 'published',
        publishedAt: shareResult.publishedAt,
        postUrn: shareResult.postUrn
      };
    }

    db.prepare('UPDATE post_drafts SET status = ? WHERE id = ?').run('approved', draftId);
    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, 'post_draft_approved', 'success', ?, ?)`
    ).run(generateId(), userId, JSON.stringify({ draftId }), now);

    return { draftId, status: 'approved' };
  }

  getActivityLogs(userId, limit = 50) {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, action_type, status, details_json, created_at
         FROM activity_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(userId, limit);

    return rows.map((r) => ({
      ...r,
      details: JSON.parse(r.details_json || '{}')
    }));
  }

  purgeUserData(userId) {
    const db = getDb();
    db.prepare('DELETE FROM linkedin_accounts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM profile_revisions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM profile_variations WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM post_drafts WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM automation_jobs WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM oauth_states WHERE user_id = ?').run(userId);

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE profiles
       SET headline = '', about = '', target_role = '', target_industry = '',
           target_keywords = '[]', language = 'id', experience_json = '[]',
           skills_json = '[]', education_json = '[]', certifications_json = '[]',
           projects_json = '[]', featured_json = '[]', contact_info_json = '{}',
           completeness_score = 0, updated_at = ?
       WHERE user_id = ?`
    ).run(now, userId);

    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, 'purge_user_data', 'success', ?, ?)`
    ).run(generateId(), userId, JSON.stringify({ message: 'All personal profile and token data purged' }), now);

    return { purged: true, message: 'All profile and integration data successfully deleted' };
  }
}

export const automationService = new AutomationService();
