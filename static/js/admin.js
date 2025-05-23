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
                ${suspect.image_url && suspect.image_url !== '/static/default-profile.svg' ?
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
            <button onclick="deleteSuspect(${suspect.id}, '${suspect.name}')" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Function to reset the suspect modal to its "add" state
function resetSuspectModal() {
    const modal = document.getElementById('suspectModal');
    const form = document.getElementById('suspectForm');
    const title = document.getElementById('modalTitle');

    modal.classList.add('hidden');
    form.reset(); // Resets all form fields to their default values
    title.textContent = 'Add New Suspect';
    delete form.dataset.editingId; // Remove the editing ID indicator
    // Ensure the placeholder for image_url is reset if it was changed
    form.elements['image_url'].placeholder = ''; 
}

// Edit Suspect Function
function editSuspect(suspectId) {
    fetch(`/api/suspects/${suspectId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {throw new Error(err.error || 'Failed to fetch suspect details.')});
            }
            return response.json();
        })
        .then(suspect => {
            const form = document.getElementById('suspectForm');
            form.reset(); // Clear form before populating for edit

            form.elements['name'].value = suspect.name || '';
            form.elements['alias'].value = suspect.alias || '';
            form.elements['date_of_birth'].value = suspect.date_of_birth || '';
            form.elements['nationality'].value = suspect.nationality || '';
            form.elements['status'].value = suspect.status || 'wanted';
            form.elements['crime_type'].value = suspect.crime_type || 'cybercrime';
            form.elements['description'].value = suspect.description || '';
            form.elements['last_seen'].value = suspect.last_seen || '';
            
            // Handle image_url: if it's the default, show empty in form, otherwise populate
            // The placeholder will indicate the current image if not default
            if (suspect.image_url && suspect.image_url !== '/static/default-profile.svg') {
                form.elements['image_url'].value = suspect.image_url;
                form.elements['image_url'].placeholder = `Current: ${suspect.image_url.substring(suspect.image_url.lastIndexOf('/') + 1)}`;
            } else {
                form.elements['image_url'].value = '';
                form.elements['image_url'].placeholder = 'Using default image';
            }

            document.getElementById('modalTitle').textContent = 'Edit Suspect';
            form.dataset.editingId = suspectId; // Store the ID for submission

            document.getElementById('suspectModal').classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error fetching suspect for edit:', error);
            alert(error.message || 'Could not load suspect data for editing.');
        });
}

// Delete Suspect Function
function deleteSuspect(suspectId, suspectName) {
    const confirmationMessage = suspectName 
        ? `Are you sure you want to delete ${suspectName}? This action cannot be undone.`
        : 'Are you sure you want to delete this suspect? This action cannot be undone.';
    
    if (!confirm(confirmationMessage)) {
        return;
    }
    fetch(`/api/suspects/${suspectId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Failed to delete suspect');
            });
        }
        return response.json();
    })
    .then(data => {
        alert(data.message || 'Suspect deleted successfully!');
        loadSuspects(); // Refresh the list
    })
    .catch(error => {
        console.error('Error deleting suspect:', error);
        alert(error.message || 'Failed to delete suspect. Please try again.');
    });
}


// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    const suspectModal = document.getElementById('suspectModal');
    const suspectForm = document.getElementById('suspectForm');
    const modalTitle = document.getElementById('modalTitle');

    // Add Suspect Button
    document.getElementById('addSuspectBtn').addEventListener('click', function() {
        resetSuspectModal(); 
        // Explicitly ensure form is clear and set for "add" mode
        suspectForm.reset();
        modalTitle.textContent = 'Add New Suspect';
        delete suspectForm.dataset.editingId;
        suspectForm.elements['image_url'].placeholder = 'Leave empty for default image';
        suspectModal.classList.remove('hidden');
    });

    // Cancel Button
    document.getElementById('cancelSuspectBtn').addEventListener('click', function() {
        resetSuspectModal();
    });

    // Form Submit (Handles both Add and Edit)
    suspectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const editingId = e.target.dataset.editingId;
        const formData = new FormData(e.target);
        const data = {};
        
        formData.forEach((value, key) => {
            // For PUT (edit), we want to send all fields, even if empty, to allow clearing them.
            // For POST (add), we can skip empty non-essential fields or rely on backend defaults.
            if (editingId || value.trim() !== '') {
                 data[key] = value.trim();
            }
        });
        
        // Default values for 'add' mode
        if (!editingId) {
            if (!data.status) data.status = 'wanted'; // Default status for new suspects
            if (!data.crime_type) data.crime_type = 'cybercrime'; // Default crime type
            if (!data.image_url) { // If image_url is empty for a new suspect, use default
                data.image_url = '/static/default-profile.svg';
            }
        } else {
            // For 'edit' mode, if image_url is submitted as empty, it means the user wants to clear it.
            // The backend should handle this by setting it to the default or null.
            // If the placeholder was indicating a default image and the field is empty,
            // it means the user wants to keep using the default.
            if (data.image_url === '' && e.target.elements['image_url'].placeholder === 'Using default image') {
                 data.image_url = '/static/default-profile.svg'; // Explicitly set to default
            }
            // If image_url is empty and it's not the default placeholder, it means clear custom image.
            // The backend should then set it to default. An empty string is fine here.
        }

        let method = 'POST';
        let url = '/api/suspects';
        let successMessage = 'Suspect added successfully!';

        if (editingId) {
            method = 'PUT';
            url = `/api/suspects/${editingId}`;
            successMessage = 'Suspect updated successfully!';
        }
        
        console.log('Submitting data:', data, 'Method:', method, 'URL:', url);
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    const serverError = errData.error || (errData.errors ? JSON.stringify(errData.errors) : 'Unknown server error');
                    throw new Error(serverError || `Failed to ${editingId ? 'update' : 'add'} suspect`);
                });
            }
            return response.json();
        })
        .then(responseData => {
            resetSuspectModal();
            loadSuspects();
            alert(responseData.message || successMessage);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message || `Failed to ${editingId ? 'update' : 'add'} suspect. Please try again.`);
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
