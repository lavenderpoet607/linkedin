import { getDb } from '../db/database.js';
import { generateId } from './cryptoService.js';

const SLOP_BUZZWORDS = [
  'passionate',
  'rockstar',
  'ninja',
  'guru',
  'synergy',
  'cutting edge',
  'cutting-edge',
  'seamless',
  'seamlessly',
  'revolutionary',
  'results-driven',
  'results driven',
  'hardworking',
  'hard-working',
  'dynamic professional',
  'go-getter',
  'proven track record',
  'game changer',
  'game-changer',
  'visionary',
  'disruptive',
  'best in class',
  'thought leader'
];

export class ProfileOptimizerService {
  calculateCompleteness(profile) {
    let score = 0;
    if (profile.headline && profile.headline.trim().length >= 20) score += 15;
    if (profile.about && profile.about.trim().length >= 100) score += 20;
    if (profile.target_role && profile.target_role.trim().length > 0) score += 10;

    const experience = Array.isArray(profile.experience) ? profile.experience : [];
    if (experience.length >= 1) score += 15;
    if (experience.some((e) => e.achievements_metrics && e.achievements_metrics.length > 0)) score += 10;

    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    if (skills.length >= 5) score += 10;

    const education = Array.isArray(profile.education) ? profile.education : [];
    if (education.length >= 1) score += 5;

    const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
    if (certifications.length >= 1) score += 5;

    const projects = Array.isArray(profile.projects) ? profile.projects : [];
    if (projects.length >= 1) score += 5;

    if (profile.contact_info && (profile.contact_info.email || profile.contact_info.portfolio_url)) score += 5;

    return Math.min(score, 100);
  }

  auditProfile(profile) {
    const issues = [];
    const recommendations = [];
    const detectedBuzzwords = [];

    const fullText = [
      profile.headline || '',
      profile.about || '',
      ...(profile.experience || []).flatMap((e) => [
        e.title || '',
        ...(e.responsibilities || []),
        ...(e.achievements_metrics || [])
      ])
    ]
      .join(' ')
      .toLowerCase();

    for (const buzzword of SLOP_BUZZWORDS) {
      if (fullText.includes(buzzword)) {
        detectedBuzzwords.push(buzzword);
      }
    }

    if (detectedBuzzwords.length > 0) {
      issues.push({
        tier: 'medium',
        type: 'buzzwords',
        message: `Profile contains generic buzzwords: ${detectedBuzzwords.join(', ')}`,
        suggestion: 'Replace buzzwords with specific achievements, concrete tools, or measurable responsibilities.'
      });
    }

    if (!profile.headline || profile.headline.trim().length === 0) {
      issues.push({
        tier: 'high',
        type: 'missing_headline',
        message: 'Headline is missing',
        suggestion: 'Add a targeted headline with your current role, primary expertise, and key technical stack.'
      });
    } else if (profile.headline.length < 30) {
      issues.push({
        tier: 'medium',
        type: 'short_headline',
        message: 'Headline is too brief for optimal search visibility',
        suggestion: 'Expand your headline to include core specialization and target technologies.'
      });
    } else if (profile.headline.includes('|') && profile.headline.split('|').length > 4) {
      issues.push({
        tier: 'low',
        type: 'overcrowded_headline',
        message: 'Headline has excessive keyword separators',
        suggestion: 'Refine headline to a cohesive value statement rather than a long list of keywords.'
      });
    }

    if (!profile.about || profile.about.trim().length === 0) {
      issues.push({
        tier: 'high',
        type: 'missing_about',
        message: 'About summary is empty',
        suggestion: 'Write a narrative summary explaining your engineering background, core competencies, and career focus.'
      });
    } else if (profile.about.trim().length < 150) {
      issues.push({
        tier: 'medium',
        type: 'short_about',
        message: 'About summary is shorter than recommended (under 150 characters)',
        suggestion: 'Structure your summary with an opening statement, technical strengths, key accomplishments, and contact info.'
      });
    }

    const exp = profile.experience || [];
    if (exp.length === 0) {
      issues.push({
        tier: 'high',
        type: 'missing_experience',
        message: 'No professional experience entries provided',
        suggestion: 'Add your current and past roles with specific responsibilities and outcomes.'
      });
    } else {
      for (const item of exp) {
        const hasMetrics = item.achievements_metrics && item.achievements_metrics.length > 0;
        if (!hasMetrics) {
          issues.push({
            tier: 'medium',
            type: 'missing_metrics',
            message: `Role at ${item.company || 'unnamed company'} lacks quantified results`,
            suggestion: `Add concrete outcomes for ${item.title || 'this role'} (e.g. throughput increase, user growth, latency reduction).`
          });
        }
      }
    }

    const skills = profile.skills || [];
    if (skills.length < 5) {
      issues.push({
        tier: 'medium',
        type: 'few_skills',
        message: `Only ${skills.length} skills listed (recommended: 10 to 25 skills)`,
        suggestion: 'Add relevant programming languages, frameworks, system tools, and methodologies you actively use.'
      });
    }

    if (!profile.target_role || profile.target_role.trim().length === 0) {
      recommendations.push('Specify a target career role to enable precise keyword alignment and ATS ranking optimization.');
    }

    if (!profile.contact_info || (!profile.contact_info.email && !profile.contact_info.portfolio_url)) {
      recommendations.push('Add a direct contact channel (email or portfolio URL) to make it easy for recruiters to connect.');
    }

    const completenessScore = this.calculateCompleteness(profile);

    return {
      completenessScore,
      totalIssues: issues.length,
      issues,
      recommendations,
      detectedBuzzwords,
      auditedAt: new Date().toISOString()
    };
  }

  generateHeadlineOptions(profile) {
    const role = profile.target_role || (profile.experience && profile.experience[0]?.title) || 'Software Engineer';
    const topSkills = (profile.skills || []).slice(0, 3).join(', ') || 'Modern Systems';
    const company = profile.experience && profile.experience[0]?.company ? profile.experience[0].company : '';
    const industry = profile.target_industry || 'Technology';

    const options = [
      {
        angle: 'Technical Depth',
        headline: `${role} | Specializing in ${topSkills} | Building Reliable ${industry} Solutions`
      },
      {
        angle: 'Impact & Product Value',
        headline: company
          ? `${role} at ${company} | Architecting Scalable Systems with ${topSkills}`
          : `${role} | Delivering High-Performance Systems with ${topSkills}`
      },
      {
        angle: 'Domain Leadership',
        headline: `${role} | Focus on ${topSkills} and Engineering Best Practices | ${industry}`
      }
    ];

    return options.map((opt) => ({
      ...opt,
      characterCount: opt.headline.length,
      fitsLimit: opt.headline.length <= 220
    }));
  }

  generateOptimizedAbout(profile, language = 'id', angle = 'Technical Depth') {
    const isId = language === 'id';
    const role = profile.target_role || (profile.experience && profile.experience[0]?.title) || 'Software Engineer';
    const skillsList = (profile.skills || []).slice(0, 8);
    const skillsStr = skillsList.length > 0 ? skillsList.join(', ') : (isId ? 'rekayasa perangkat lunak modern' : 'modern software engineering');
    const exp = profile.experience || [];
    const currentExp = exp[0];
    const pastExp = exp.slice(1, 3);

    let narrative = '';
    if (isId) {
      narrative += `Sebagai ${role}, fokus utama saya adalah membangun sistem perangkat lunak yang andal, efisien, dan mudah dipelihara.`;
      if (currentExp) {
        narrative += ` Saat ini saya bekerja di ${currentExp.company || 'industri teknologi'} dengan tanggung jawab pada perancangan arsitektur dan eksekusi teknis.`;
      }
      narrative += `\n\nKeahlian Inti:\n${skillsStr}\n\n`;

      if (currentExp && currentExp.achievements_metrics && currentExp.achievements_metrics.length > 0) {
        narrative += 'Pencapaian dan Fokus Kerja:\n';
        for (const m of currentExp.achievements_metrics) {
          narrative += `• ${m}\n`;
        }
        narrative += '\n';
      }

      if (angle === 'Team Leadership') {
        narrative += 'Pendekatan Kerja:\nSaya mengutamakan kolaborasi tim yang transparan, code review yang konstruktif, serta dokumentasi sistem yang jelas agar tim dapat bergerak cepat tanpa mengorbankan kualitas kode.\n\n';
      } else if (angle === 'Impact & Product Value') {
        narrative += 'Fokus Dampak Bisnis:\nSetiap keputusan arsitektur diarahkan untuk mendukung stabilitas produk, performa pengguna akhir, dan efisiensi operasional sistem.\n\n';
      } else {
        narrative += 'Standar Rekayasa:\nSaya menerapkan prinsip desain modular, pengujian menyeluruh, serta otomatisasi pipeline untuk menjaga keandalan sistem produksi.\n\n';
      }

      narrative += 'Terbuka untuk diskusi mengenai peluang rekayasa perangkat lunak, kolaborasi teknis, dan proyek arsitektur sistem.';
    } else {
      narrative += `As a ${role}, my primary focus is developing resilient, efficient, and maintainable software systems.`;
      if (currentExp) {
        narrative += ` Currently contributing at ${currentExp.company || 'the technology sector'}, leading technical design and implementation.`;
      }
      narrative += `\n\nCore Competencies:\n${skillsStr}\n\n`;

      if (currentExp && currentExp.achievements_metrics && currentExp.achievements_metrics.length > 0) {
        narrative += 'Key Outcomes and Highlights:\n';
        for (const m of currentExp.achievements_metrics) {
          narrative += `• ${m}\n`;
        }
        narrative += '\n';
      }

      if (angle === 'Team Leadership') {
        narrative += 'Engineering Approach:\nI prioritize transparent team collaboration, rigorous code reviews, and structured system documentation to support velocity with high software quality.\n\n';
      } else if (angle === 'Impact & Product Value') {
        narrative += 'Business Value Focus:\nEvery architectural choice is aligned with end-user reliability, performance, and long-term maintainability.\n\n';
      } else {
        narrative += 'Technical Standards:\nI practice modular system architecture, thorough automated testing, and CI/CD automation to maintain dependable production environments.\n\n';
      }

      narrative += 'Open to discussions regarding engineering opportunities, technical collaboration, and system architecture challenges.';
    }

    return narrative;
  }

  optimizeExperienceBulletPoints(experienceItem, language = 'id') {
    const isId = language === 'id';
    const bullets = [];

    const responsibilities = experienceItem.responsibilities || [];
    const metrics = experienceItem.achievements_metrics || [];
    const tech = (experienceItem.tech_stack || []).join(', ');

    for (const r of responsibilities) {
      if (r.trim().length > 0) {
        bullets.push(r.trim());
      }
    }

    for (const m of metrics) {
      if (m.trim().length > 0) {
        bullets.push(isId ? `Pencapaian: ${m.trim()}` : `Key result: ${m.trim()}`);
      }
    }

    if (bullets.length === 0) {
      if (isId) {
        bullets.push(`Bertanggung jawab atas pengembangan dan pemeliharaan komponen inti di ${experienceItem.company || 'perusahaan'}.`);
        if (tech) bullets.push(`Mengimplementasikan solusi dengan tumpukan teknologi: ${tech}.`);
        bullets.push('[Tambahkan metrik terukur: contohnya peningkatan performa, volume pengguna, atau efisiensi proses]');
      } else {
        bullets.push(`Responsible for core system development and service stability at ${experienceItem.company || 'the organization'}.`);
        if (tech) bullets.push(`Implemented solutions utilizing technology stack: ${tech}.`);
        bullets.push('[Add measurable outcome: e.g. performance gains, request throughput, or delivery time reduction]');
      }
    }

    return bullets;
  }

  generateThreeAngleVariations(profile) {
    const lang = profile.language || 'id';
    const angles = [
      {
        angle: 'Technical Depth',
        headline: this.generateHeadlineOptions(profile)[0].headline,
        about: this.generateOptimizedAbout(profile, lang, 'Technical Depth')
      },
      {
        angle: 'Impact & Product Value',
        headline: this.generateHeadlineOptions(profile)[1].headline,
        about: this.generateOptimizedAbout(profile, lang, 'Impact & Product Value')
      },
      {
        angle: 'Team Leadership',
        headline: this.generateHeadlineOptions(profile)[2].headline,
        about: this.generateOptimizedAbout(profile, lang, 'Team Leadership')
      }
    ];
    return angles;
  }

  saveSnapshot(userId, profileId, changeSummary = 'Manual update') {
    const db = getDb();
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(profileId, userId);
    if (!profile) return null;

    const countRow = db
      .prepare('SELECT COUNT(*) as count FROM profile_revisions WHERE profile_id = ? AND user_id = ?')
      .get(profileId, userId);
    const versionNumber = (countRow ? countRow.count : 0) + 1;

    const revisionId = generateId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO profile_revisions
       (id, user_id, profile_id, version_number, snapshot_json, change_summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(revisionId, userId, profileId, versionNumber, JSON.stringify(profile), changeSummary, now);

    return {
      revisionId,
      versionNumber,
      createdAt: now
    };
  }

  restoreRevision(userId, profileId, revisionId) {
    const db = getDb();
    const revision = db
      .prepare('SELECT * FROM profile_revisions WHERE id = ? AND profile_id = ? AND user_id = ?')
      .get(revisionId, profileId, userId);

    if (!revision) {
      throw new Error('Revision record not found');
    }

    const snapshot = JSON.parse(revision.snapshot_json);
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE profiles
       SET headline = ?, about = ?, target_role = ?, target_industry = ?,
           target_keywords = ?, language = ?, experience_json = ?,
           skills_json = ?, education_json = ?, certifications_json = ?,
           projects_json = ?, featured_json = ?, contact_info_json = ?,
           completeness_score = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(
      snapshot.headline,
      snapshot.about,
      snapshot.target_role,
      snapshot.target_industry,
      snapshot.target_keywords,
      snapshot.language,
      snapshot.experience_json,
      snapshot.skills_json,
      snapshot.education_json,
      snapshot.certifications_json,
      snapshot.projects_json,
      snapshot.featured_json,
      snapshot.contact_info_json,
      snapshot.completeness_score,
      now,
      profileId,
      userId
    );

    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, status, details_json, created_at)
       VALUES (?, ?, 'profile_restore_revision', 'success', ?, ?)`
    ).run(generateId(), userId, JSON.stringify({ versionNumber: revision.version_number }), now);

    return this.getProfile(userId);
  }

  getProfile(userId) {
    const db = getDb();
    let row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    if (!row) {
      const now = new Date().toISOString();
      const newId = generateId();
      db.prepare(
        `INSERT INTO profiles (id, user_id, updated_at) VALUES (?, ?, ?)`
      ).run(newId, userId, now);
      row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(newId);
    }

    return {
      id: row.id,
      userId: row.user_id,
      headline: row.headline,
      about: row.about,
      targetRole: row.target_role,
      targetIndustry: row.target_industry,
      targetKeywords: JSON.parse(row.target_keywords || '[]'),
      language: row.language,
      experience: JSON.parse(row.experience_json || '[]'),
      skills: JSON.parse(row.skills_json || '[]'),
      education: JSON.parse(row.education_json || '[]'),
      certifications: JSON.parse(row.certifications_json || '[]'),
      projects: JSON.parse(row.projects_json || '[]'),
      featured: JSON.parse(row.featured_json || '[]'),
      contactInfo: JSON.parse(row.contact_info_json || '{}'),
      completenessScore: row.completeness_score,
      updatedAt: row.updated_at
    };
  }

  updateProfile(userId, updates, summary = 'Updated profile data') {
    const db = getDb();
    const current = this.getProfile(userId);

    const merged = {
      headline: updates.headline !== undefined ? updates.headline : current.headline,
      about: updates.about !== undefined ? updates.about : current.about,
      target_role: updates.target_role !== undefined ? updates.target_role : current.targetRole,
      target_industry: updates.target_industry !== undefined ? updates.target_industry : current.targetIndustry,
      target_keywords: updates.target_keywords !== undefined ? updates.target_keywords : current.targetKeywords,
      language: updates.language !== undefined ? updates.language : current.language,
      experience: updates.experience !== undefined ? updates.experience : current.experience,
      skills: updates.skills !== undefined ? updates.skills : current.skills,
      education: updates.education !== undefined ? updates.education : current.education,
      certifications: updates.certifications !== undefined ? updates.certifications : current.certifications,
      projects: updates.projects !== undefined ? updates.projects : current.projects,
      featured: updates.featured !== undefined ? updates.featured : current.featured,
      contact_info: updates.contact_info !== undefined ? updates.contact_info : current.contactInfo
    };

    const completeness = this.calculateCompleteness(merged);
    const now = new Date().toISOString();

    this.saveSnapshot(userId, current.id, summary);

    db.prepare(
      `UPDATE profiles
       SET headline = ?, about = ?, target_role = ?, target_industry = ?,
           target_keywords = ?, language = ?, experience_json = ?,
           skills_json = ?, education_json = ?, certifications_json = ?,
           projects_json = ?, featured_json = ?, contact_info_json = ?,
           completeness_score = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(
      merged.headline,
      merged.about,
      merged.target_role,
      merged.target_industry,
      JSON.stringify(merged.target_keywords),
      merged.language,
      JSON.stringify(merged.experience),
      JSON.stringify(merged.skills),
      JSON.stringify(merged.education),
      JSON.stringify(merged.certifications),
      JSON.stringify(merged.projects),
      JSON.stringify(merged.featured),
      JSON.stringify(merged.contact_info),
      completeness,
      now,
      current.id,
      userId
    );

    return this.getProfile(userId);
  }

  getRevisions(userId) {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, version_number, change_summary, created_at
         FROM profile_revisions
         WHERE user_id = ?
         ORDER BY version_number DESC`
      )
      .all(userId);
    return rows;
  }
}

export const profileOptimizerService = new ProfileOptimizerService();
