// app.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// DOM elements
const loginPanel = document.getElementById('login-panel');
const dashboard = document.getElementById('dashboard');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');
const userNameDisplay = document.getElementById('user-name');

const loadCharactersButton = document.getElementById('load-characters');
const characterList = document.getElementById('character-list');

const loadNpcsButton = document.getElementById('load-npcs');
const npcList = document.getElementById('npc-list');

const loadStatBlocksButton = document.getElementById('load-stat-blocks');
const statBlockList = document.getElementById('statblock-list');
const createStatBlockButton = document.getElementById('create-stat-block');

// Modal elements (assume added in index.html)
const modal = document.getElementById('modal');
const modalForm = document.getElementById('modal-form');
const modalLabel = document.getElementById('modal-label');
const modalDEF = document.getElementById('modal-def');
const modalINIT = document.getElementById('modal-init');
const modalRES = document.getElementById('modal-res');
const modalDEX = document.getElementById('modal-dex');
const modalPER = document.getElementById('modal-per');
const modalSTR = document.getElementById('modal-str');
const modalBlasters = document.getElementById('modal-blasters');
const modalIntimidate = document.getElementById('modal-intimidate');
const modalSubmit = document.getElementById('modal-submit');
const modalClose = document.getElementById('modal-close');

let currentUser = null;
let editingStatBlockId = null;

// Ensure modal is hidden on load
if (modal) modal.classList.add('hidden');

function openModal(stat = null) {
  document.body.classList.add('modal-open');
  modal.classList.remove('hidden');
  if (stat) {
    editingStatBlockId = stat.id;
    modalLabel.value = stat.label;
    modalDEF.value = stat.derived.defense;
    modalINIT.value = stat.derived.initiative;
    modalRES.value = stat.derived.resolve;
    modalDEX.value = stat.attributes.DEX;
    modalPER.value = stat.attributes.PER;
    modalSTR.value = stat.attributes.STR;
    modalBlasters.value = stat.skills.Blasters;
    modalIntimidate.value = stat.skills.Intimidate;
  } else {
    editingStatBlockId = null;
    modalForm.reset();
  }
}

function closeModal() {
  document.body.classList.remove('modal-open');
  modal.classList.add('hidden');
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

modalForm.onsubmit = async (e) => {
  e.preventDefault();

  const updated = {
    label: modalLabel.value,
    derived: {
      defense: parseInt(modalDEF.value),
      initiative: parseInt(modalINIT.value),
      resolve: parseInt(modalRES.value)
    },
    attributes: {
      DEX: parseInt(modalDEX.value),
      PER: parseInt(modalPER.value),
      STR: parseInt(modalSTR.value)
    },
    skills: {
      Blasters: parseInt(modalBlasters.value),
      Intimidate: parseInt(modalIntimidate.value)
    },
    armor_dice: 2,
    equipment: {
      weapons: ['Blaster Rifle'],
      armor: 'Light Armor'
    }
  };

  let error;
  if (editingStatBlockId) {
    ({ error } = await supabase.from('stat_blocks').update(updated).eq('id', editingStatBlockId));
  } else {
    ({ error } = await supabase.from('stat_blocks').insert([updated]));
  }

  if (error) return alert('Error saving stat block: ' + error.message);
  closeModal();
  loadStatBlocks();
};

async function loadStatBlocks() {
  const { data, error } = await supabase
    .from('stat_blocks')
    .select('*');

  if (error) {
    alert('Error loading stat blocks: ' + error.message);
    return;
  }

  statBlockList.innerHTML = '';
  data.forEach(stat => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${stat.label}</strong> — DEF: ${stat.derived.defense}, INIT: ${stat.derived.initiative}, RES: ${stat.derived.resolve}<br>
      ATTR: DEX ${stat.attributes.DEX}, PER ${stat.attributes.PER}, STR ${stat.attributes.STR}<br>
      SKILLS: Blasters ${stat.skills.Blasters}, Intimidate ${stat.skills.Intimidate}`;

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentUser && stat?.id && !document.body.classList.contains('modal-open')) {
        openModal(stat);
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete ${stat.label}?`)) return;
      const { error } = await supabase
        .from('stat_blocks')
        .delete()
        .eq('id', stat.id);

      if (error) return alert('Delete failed: ' + error.message);
      loadStatBlocks();
    };

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    statBlockList.appendChild(li);
  });
}

async function loadCharacters() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('owner_id', currentUser.id)
    .eq('type', 'PC');

  if (error) {
    alert('Error loading characters: ' + error.message);
    return;
  }

  characterList.innerHTML = '';
  data.forEach(char => {
    const li = document.createElement('li');
    li.textContent = `${char.name} (${char.role})`;
    characterList.appendChild(li);
  });
}

// Tab Switching
const tabButtons = document.querySelectorAll('.tab-button');
const navButtons = document.querySelectorAll('#top-nav button');
const topNav = document.getElementById('top-nav');
const tabContents = document.querySelectorAll('.tab-content');

function switchTab(target) {
  topNav.classList.remove('hidden');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  navButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(tab => tab.classList.add('hidden'));

  document.querySelectorAll(`[data-tab="${target}"]`).forEach(btn => btn.classList.add('active'));
  document.getElementById(`tab-${target}`).classList.remove('hidden');
}

// Removed default tab switch to prevent premature UI changes

tabButtons.forEach(button => {
  button.addEventListener('click', () => switchTab(button.getAttribute('data-tab')));
});
navButtons.forEach(button => {
  button.addEventListener('click', () => switchTab(button.getAttribute('data-tab')));
});

function showDashboard(user) {
  currentUser = user;
  userNameDisplay.textContent = user.email;
  loginPanel.classList.add('hidden');
  dashboard.classList.remove('hidden');
  closeModal();
  switchTab('home');
}

// Event Listeners
loginButton.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });
  if (error) return alert('Login error: ' + error.message);
  showDashboard(data.user);
});

signupButton.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });
  if (error) return alert('Signup error: ' + error.message);
  showDashboard(data.user);
});

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showLogin();
});

loadCharactersButton.addEventListener('click', loadCharacters);
loadNpcsButton.addEventListener('click', loadNpcs);
loadStatBlocksButton.addEventListener('click', loadStatBlocks);
if (createStatBlockButton) {
  createStatBlockButton.addEventListener('click', () => {
    if (currentUser) openModal();
  });
}

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    closeModal();
    showDashboard(session.user);
    switchTab('home');
  } else {
    showLogin();
  }
});
