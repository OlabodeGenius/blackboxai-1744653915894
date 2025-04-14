// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

// Authentication Functions
function checkAuthStatus() {
    fetch('/api/login', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            showDashboard();
            loadSuspects();
            loadTips();
        } else {
            showLoginForm();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showLoginForm();
    });
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            showDashboard();
            loadSuspects();
            loadTips();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Login failed. Please try again.');
    });
});

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', function() {
    fetch('/api/logout', {
        method: 'GET',
        credentials: 'include'
    })
    .then(() => {
        showLoginForm();
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Update button styles
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        });
        this.classList.remove('bg-gray-700', 'hover:bg-gray-600');
        this.classList.add('bg-blue-600', 'hover:bg-blue-700');
        
        // Show/hide content
        document.querySelectorAll('#suspectsTab, #tipsTab').forEach(tab => {
            tab.classList.add('hidden');
        });
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    });
});

// Suspects Management
function loadSuspects() {
    fetch('/api/suspects')
        .then(response => response.json())
        .then(suspects => {
            const suspectsList = document.getElementById('suspectsList');
            suspectsList.innerHTML = '';
            
            suspects.forEach(suspect => {
                const suspectCard = createSuspectCard(suspect);
                suspectsList.appendChild(suspectCard);
            });
        })
        .catch(error => console.error('Error:', error));
}

function createSuspectCard(suspect) {
    const div = document.createElement('div');
    div.className = 'bg-gray-700 rounded-lg p-4 flex items-start justify-between';
    div.innerHTML = `
        <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0">
                ${suspect.image_url ? 
                    `<img src="${suspect.image_url}" alt="${suspect.name}" class="w-full h-full object-cover rounded-lg">` :
                    `<i class="fas fa-user text-3xl text-gray-400 w-full h-full flex items-center justify-center"></i>`
                }
            </div>
            <div>
                <h3 class="font-semibold text-lg">${suspect.name}</h3>
                <p class="text-gray-400">${suspect.crime_type}</p>
                <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    suspect.status === 'wanted' ? 'bg-red-500' :
                    suspect.status === 'arrested' ? 'bg-yellow-500' :
                    'bg-green-500'
                }">${suspect.status}</span>
            </div>
        </div>
        <div class="flex space-x-2">
            <button onclick="editSuspect(${suspect.id})" class="text-blue-400 hover:text-blue-300">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteSuspect(${suspect.id})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add Suspect Button
    document.getElementById('addSuspectBtn').addEventListener('click', function() {
        document.getElementById('suspectModal').classList.remove('hidden');
    });

    // Cancel Button
    document.getElementById('cancelSuspectBtn').addEventListener('click', function() {
        document.getElementById('suspectModal').classList.add('hidden');
    });

    // Form Submit
    document.getElementById('suspectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(e.target);
        const data = {};
        
        // Process form data
        formData.forEach((value, key) => {
            // Only include non-empty values
            if (value.trim() !== '') {
                data[key] = value;
            }
        });

        // Add default values
        if (!data.status) data.status = 'wanted';
        if (!data.crime_type) data.crime_type = 'cybercrime';
        
        console.log('Submitting data:', data);
        
        fetch('/api/suspects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to add suspect');
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('suspectModal').classList.add('hidden');
            document.getElementById('suspectForm').reset();
            loadSuspects();
            alert('Suspect added successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message || 'Failed to add suspect. Please try again.');
        });
    });
});

// Tips Management
function loadTips() {
    fetch('/api/tips', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(tips => {
        const tipsList = document.getElementById('tipsList');
        tipsList.innerHTML = '';
        
        tips.forEach(tip => {
            const tipCard = createTipCard(tip);
            tipsList.appendChild(tipCard);
        });
    })
    .catch(error => console.error('Error:', error));
}

function createTipCard(tip) {
    const div = document.createElement('div');
    div.className = 'bg-gray-700 rounded-lg p-4';
    div.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-semibold">${tip.incident_type}</h3>
                <p class="text-sm text-gray-400">${tip.location}</p>
                <p class="mt-2">${tip.description}</p>
                <p class="text-sm text-gray-400 mt-2">Submitted: ${tip.date_submitted}</p>
            </div>
            <select onchange="updateTipStatus(${tip.id}, this.value)" class="bg-gray-600 border border-gray-500 rounded px-2 py-1">
                <option value="pending" ${tip.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="reviewed" ${tip.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                <option value="actionable" ${tip.status === 'actionable' ? 'selected' : ''}>Actionable</option>
            </select>
        </div>
    `;
    return div;
}

function updateTipStatus(tipId, status) {
    fetch(`/api/tips/${tipId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        loadTips();
    })
    .catch(error => console.error('Error:', error));
}
