export class ExportService {
  toMarkdown(profile, auditResult = null) {
    const lines = [];

    lines.push(`# LinkedIn Profile: ${profile.targetRole || 'Professional Profile'}`);
    lines.push(`Exported on: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Headline');
    lines.push(profile.headline || '(No headline set)');
    lines.push('');

    lines.push('## About / Summary');
    lines.push(profile.about || '(No about summary set)');
    lines.push('');

    lines.push('## Experience');
    const exp = profile.experience || [];
    if (exp.length === 0) {
      lines.push('(No experience entries)');
    } else {
      for (const item of exp) {
        const period = `${item.start_date || ''} to ${item.is_current ? 'Present' : item.end_date || ''}`.trim();
        lines.push(`### ${item.title} at ${item.company}`);
        if (period) lines.push(`*${period}*`);
        if (item.location) lines.push(`Location: ${item.location}`);
        lines.push('');

        if (item.responsibilities && item.responsibilities.length > 0) {
          lines.push('Responsibilities:');
          for (const r of item.responsibilities) {
            lines.push(`- ${r}`);
          }
          lines.push('');
        }

        if (item.tech_stack && item.tech_stack.length > 0) {
          lines.push(`Technologies: ${item.tech_stack.join(', ')}`);
          lines.push('');
        }

        if (item.achievements_metrics && item.achievements_metrics.length > 0) {
          lines.push('Key Results:');
          for (const m of item.achievements_metrics) {
            lines.push(`- ${m}`);
          }
          lines.push('');
        }
      }
    }

    lines.push('## Skills');
    const skills = profile.skills || [];
    if (skills.length === 0) {
      lines.push('(No skills listed)');
    } else {
      lines.push(skills.map((s) => `- ${s}`).join('\n'));
    }
    lines.push('');

    lines.push('## Education');
    const edu = profile.education || [];
    if (edu.length === 0) {
      lines.push('(No education entries)');
    } else {
      for (const e of edu) {
        lines.push(`- **${e.institution}**: ${e.degree || ''} in ${e.field_of_study || ''} (${e.start_year || ''} - ${e.end_year || ''})`);
      }
    }
    lines.push('');

    lines.push('## Certifications');
    const certs = profile.certifications || [];
    if (certs.length === 0) {
      lines.push('(No certifications listed)');
    } else {
      for (const c of certs) {
        lines.push(`- **${c.name}** issued by ${c.issuing_organization} (${c.issue_date || ''})`);
      }
    }
    lines.push('');

    lines.push('## Projects');
    const projects = profile.projects || [];
    if (projects.length === 0) {
      lines.push('(No projects listed)');
    } else {
      for (const p of projects) {
        lines.push(`- **${p.title}**: ${p.description || ''} (Stack: ${(p.tech_stack || []).join(', ')})`);
      }
    }
    lines.push('');

    lines.push('## Manual LinkedIn Update Steps');
    lines.push('1. Open your LinkedIn profile in a web browser.');
    lines.push('2. Click the edit pencil on your Intro card to update Headline.');
    lines.push('3. Click the edit pencil on About to paste the updated summary.');
    lines.push('4. Edit each Experience role with the structured bullets and results above.');
    lines.push('5. Add or reorder your top Skills in the Skills section.');

    return lines.join('\n');
  }

  toPlainText(profile) {
    const lines = [];

    lines.push(`LINKEDIN PROFILE OPTIMIZATION EXPORT`);
    lines.push(`Exported at: ${new Date().toISOString()}`);
    lines.push('==================================================\n');

    lines.push('HEADLINE:');
    lines.push(profile.headline || '(None)');
    lines.push('\n--------------------------------------------------\n');

    lines.push('ABOUT / SUMMARY:');
    lines.push(profile.about || '(None)');
    lines.push('\n--------------------------------------------------\n');

    lines.push('EXPERIENCE:');
    const exp = profile.experience || [];
    for (const item of exp) {
      lines.push(`* ${item.title} at ${item.company}`);
      if (item.responsibilities) {
        for (const r of item.responsibilities) {
          lines.push(`  - ${r}`);
        }
      }
      if (item.achievements_metrics) {
        for (const m of item.achievements_metrics) {
          lines.push(`  - Result: ${m}`);
        }
      }
      lines.push('');
    }
    lines.push('--------------------------------------------------\n');

    lines.push('SKILLS:');
    lines.push((profile.skills || []).join(', ') || '(None)');
    lines.push('\n--------------------------------------------------\n');

    lines.push('CONTACT INFORMATION:');
    if (profile.contactInfo) {
      if (profile.contactInfo.email) lines.push(`Email: ${profile.contactInfo.email}`);
      if (profile.contactInfo.portfolio_url) lines.push(`Portfolio: ${profile.contactInfo.portfolio_url}`);
      if (profile.contactInfo.location) lines.push(`Location: ${profile.contactInfo.location}`);
    }

    return lines.join('\n');
  }

  toJson(profile, auditResult = null) {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profile,
        audit: auditResult,
        metadata: {
          generator: 'LinkedIn Profile Optimizer',
          version: '1.0.0',
          complianceNotice: 'Official LinkedIn Member API requires manual copy for profile sections'
        }
      },
      null,
      2
    );
  }
}

export const exportService = new ExportService();
