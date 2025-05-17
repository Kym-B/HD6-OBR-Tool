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
  switchTab('home');
  loadSessions();
}

// Session Management
const sessionList = document.getElementById('session-list');
const createSessionForm = document.getElementById('create-session-form');
const newSessionName = document.getElementById('new-session-name');

async function loadSessions() {
  if (!currentUser) return;
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('gm_id', currentUser.id);

  if (error) {
    alert('Error loading sessions: ' + error.message);
    return;
  }

  sessionList.innerHTML = '';
  data.forEach(session => {
    const li = document.createElement('li');
    li.textContent = `${session.name} (created ${new Date(session.created_at).toLocaleString()})`;
    sessionList.appendChild(li);
  });
}

if (createSessionForm) {
  createSessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newSessionName.value.trim();
    if (!name) return;
    const { error } = await supabase.from('sessions').insert([{ name, gm_id: currentUser.id }]);
    if (error) {
      alert('Error creating session: ' + error.message);
      return;
    }
    newSessionName.value = '';
    loadSessions();
  });
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


supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user;
    showDashboard(currentUser);
  } else {
    showLogin();
  }
});
