(async () => {
  let me = await initApp();
  if (!me) return;
  const view = document.getElementById('profileView');
  const SOCIAL = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['twitter', 'X / Twitter'], ['website', 'Website']];

  const profileFields = [
    { name: 'name', label: 'Full name', required: true, maxlength: 80 },
    { name: 'location', label: 'Location', maxlength: 80 },
    { name: 'headline', label: 'Professional headline', full: true, maxlength: 120, placeholder: 'e.g. Full-stack developer' },
    { name: 'bio', label: 'About / description', type: 'textarea', full: true, maxlength: 1000 },
    { name: 'github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/...' },
    { name: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://linkedin.com/in/...' },
    { name: 'twitter', label: 'X / Twitter URL', type: 'url', placeholder: 'https://x.com/...' },
    { name: 'website', label: 'Website URL', type: 'url', placeholder: 'https://...' },
  ];
  const eduFields = [
    { name: 'school', label: 'School / University', required: true, full: true },
    { name: 'degree', label: 'Degree' },
    { name: 'field', label: 'Field of study' },
    { name: 'startYear', label: 'Start year', maxlength: 4, placeholder: '2021' },
    { name: 'endYear', label: 'End year', maxlength: 4, placeholder: '2025' },
  ];

  const save = async (patch) => {
    me = await api('/users/profile', { method: 'PUT', body: patch });
    refreshTopbarUser(me);
    render();
  };

  function resizeImage(file, size) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the image'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Not a valid image'));
        img.onload = () => {
          const min = Math.min(img.width, img.height);
          const c = document.createElement('canvas');
          c.width = c.height = size;
          c.getContext('2d').drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function render() {
    const s = me.social || {};
    const edu = me.education || [];
    const shareUrl = `${location.origin}/u/${me.username}`;

    view.innerHTML = `
      <div class="card profile-hero">
        <div class="cover"></div>
        <div class="profile-main">
          ${avatarHtml(me, 'avatar-xl')}
          <div class="profile-info">
            <h1>${esc(me.name)}</h1>
            <p>${esc(me.headline || 'Add a professional headline')}</p>
            <p class="muted small">${esc(me.location || '')}</p>
          </div>
          <div class="profile-actions">
            <button class="btn btn-primary" data-action="edit">Edit profile</button>
            <button class="btn btn-outline" data-action="photo">Change photo</button>
            ${me.avatar ? '<button class="btn btn-ghost" data-action="removePhoto">Remove photo</button>' : ''}
            <input type="file" id="photoInput" accept="image/png,image/jpeg,image/webp" hidden>
          </div>
        </div>
      </div>
      <div class="grid two-wide">
        <div class="stack">
          <section class="card"><h2>About</h2><p class="pre" style="margin-top:.5rem">${me.bio ? esc(me.bio) : '<span class="muted">Tell people about yourself and what you do.</span>'}</p></section>
          <section class="card">
            <div class="card-head"><h2>Education</h2><button class="btn btn-outline btn-sm" data-action="addEdu">+ Add</button></div>
            ${edu.length ? edu.map((e, i) => `
              <div class="edu-item">
                <div><strong>${esc(e.school)}</strong><div>${esc([e.degree, e.field].filter(Boolean).join(', '))}</div><div class="muted small">${esc([e.startYear, e.endYear].filter(Boolean).join(' – '))}</div></div>
                <div class="actions"><button class="btn btn-ghost btn-sm" data-action="editEdu" data-id="${i}">Edit</button><button class="btn btn-danger btn-sm" data-action="delEdu" data-id="${i}">Delete</button></div>
              </div>`).join('') : '<p class="muted">No education added yet.</p>'}
          </section>
        </div>
        <div class="stack">
          <section class="card">
            <h2>Social links</h2>
            <ul class="social-list" style="margin-top:.6rem">
              ${SOCIAL.filter(([k]) => s[k]).map(([k, label]) => `<li><strong>${label}:</strong> <a href="${safeUrl(s[k])}" target="_blank" rel="noopener noreferrer">${esc(s[k])}</a></li>`).join('') || '<li class="muted">No links added yet.</li>'}
            </ul>
          </section>
          <section class="card">
            <h2>Share your portfolio</h2>
            <p class="muted small" style="margin:.4rem 0 .6rem">${me.isPublic ? 'Your portfolio is public. Anyone with the link can view it.' : 'Your portfolio is private. Make it public in Settings to share it.'}</p>
            <div class="copy-row"><input id="shareLink" value="${esc(shareUrl)}" readonly><button class="btn btn-outline btn-sm" data-action="copy">Copy</button></div>
          </section>
        </div>
      </div>`;
  }

  onActions(view, {
    edit: () =>
      openForm({
        title: 'Edit profile',
        fields: profileFields,
        values: { ...me, ...(me.social || {}) },
        onSubmit: async (d) => {
          await save({
            name: d.name, headline: d.headline, bio: d.bio, location: d.location,
            social: { github: d.github, linkedin: d.linkedin, twitter: d.twitter, website: d.website },
          });
          toast('Profile updated');
        },
      }),
    photo: () => document.getElementById('photoInput').click(),
    removePhoto: async () => {
      try { await save({ avatar: '' }); toast('Photo removed'); } catch (e) { toast(e.message, 'error'); }
    },
    addEdu: () =>
      openForm({
        title: 'Add education', fields: eduFields,
        onSubmit: async (d) => { await save({ education: [...(me.education || []), d] }); toast('Education added'); },
      }),
    editEdu: (i) =>
      openForm({
        title: 'Edit education', fields: eduFields, values: me.education[i],
        onSubmit: async (d) => {
          const list = [...me.education];
          list[i] = d;
          await save({ education: list });
          toast('Education updated');
        },
      }),
    delEdu: async (i) => {
      if (!confirm('Remove this education entry?')) return;
      try { await save({ education: me.education.filter((_, idx) => idx !== +i) }); toast('Removed'); } catch (e) { toast(e.message, 'error'); }
    },
    copy: async () => {
      try { await navigator.clipboard.writeText(document.getElementById('shareLink').value); toast('Link copied'); }
      catch (e) { document.getElementById('shareLink').select(); toast('Press Ctrl+C to copy'); }
    },
  });

  view.addEventListener('change', async (e) => {
    if (e.target.id !== 'photoInput' || !e.target.files[0]) return;
    try {
      const dataUrl = await resizeImage(e.target.files[0], 256);
      await save({ avatar: dataUrl });
      toast('Profile photo updated');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  render();
})();