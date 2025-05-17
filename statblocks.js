// statblocks.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const loadBtn = document.getElementById('load-stat-blocks');
const createBtn = document.getElementById('create-stat-block');
const list = document.getElementById('statblock-list');
const editor = document.getElementById('stat-editor');
const form = document.getElementById('statblock-form');
const cancelBtn = document.getElementById('cancel-edit');
const title = document.getElementById('editor-title');

let currentUser = null;
let editingId = null;

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    loadStatBlocks();
  } else {
    window.location.href = 'index.html';
  }
});

async function loadStatBlocks() {
  const { data, error } = await supabase.from('stat_blocks').select('*');
  if (error) return alert('Error loading stat blocks');

  list.innerHTML = '';
  data.forEach(stat => {
    const li = document.createElement('li');
    li.textContent = `${stat.label} — DEF: ${stat.derived.defense}, INIT: ${stat.derived.initiative}`;

    const edit = document.createElement('button');
    edit.innerHTML = '<i class="fas fa-edit"></i>';
    edit.onclick = () => openEditor(stat);

    const del = document.createElement('button');
    del.innerHTML = '<i class="fas fa-trash-alt"></i>';
    del.onclick = async () => {
      if (!confirm(`Delete ${stat.label}?`)) return;
      await supabase.from('stat_blocks').delete().eq('id', stat.id);
      loadStatBlocks();
    };

    li.appendChild(edit);
    li.appendChild(del);
    list.appendChild(li);
  });
}

function openEditor(stat = null) {
  editor.classList.remove('hidden');
  editingId = stat?.id || null;
  title.textContent = editingId ? 'Edit Stat Block' : 'New Stat Block';
  form.reset();
  if (stat) {
    form.editor-label.value = stat.label;
    form.editor-def.value = stat.derived.defense;
    form.editor-init.value = stat.derived.initiative;
    form.editor-res.value = stat.derived.resolve;
    form.editor-dex.value = stat.attributes.DEX;
    form.editor-per.value = stat.attributes.PER;
    form.editor-str.value = stat.attributes.STR;
    form.editor-blasters.value = stat.skills.Blasters;
    form.editor-intimidate.value = stat.skills.Intimidate;
  }
}

function closeEditor() {
  editor.classList.add('hidden');
  editingId = null;
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const record = {
    label: form['editor-label'].value,
    derived: {
      defense: parseInt(form['editor-def'].value),
      initiative: parseInt(form['editor-init'].value),
      resolve: parseInt(form['editor-res'].value)
    },
    attributes: {
      DEX: parseInt(form['editor-dex'].value),
      PER: parseInt(form['editor-per'].value),
      STR: parseInt(form['editor-str'].value)
    },
    skills: {
      Blasters: parseInt(form['editor-blasters'].value),
      Intimidate: parseInt(form['editor-intimidate'].value)
    },
    armor_dice: 2,
    equipment: {
      weapons: ['Blaster Rifle'],
      armor: 'Light Armor'
    }
  };

  if (editingId) {
    await supabase.from('stat_blocks').update(record).eq('id', editingId);
  } else {
    await supabase.from('stat_blocks').insert([record]);
  }
  closeEditor();
  loadStatBlocks();
};

cancelBtn.onclick = closeEditor;
loadBtn.onclick = loadStatBlocks;
createBtn.onclick = () => openEditor();
