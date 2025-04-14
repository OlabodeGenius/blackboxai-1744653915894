// Particles.js Configuration
document.addEventListener('DOMContentLoaded', function() {
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#3B82F6'
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.5,
                random: false,
                anim: {
                    enable: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#3B82F6',
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 1
                    }
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });
});

// Load and display suspects
function loadSuspects() {
    fetch('/api/suspects')
        .then(response => response.json())
        .then(suspects => {
            const grid = document.querySelector('#suspects-grid .grid');
            grid.innerHTML = '';
            
            suspects.forEach(suspect => {
                const card = createSuspectCard(suspect);
                grid.appendChild(card);
            });
        })
        .catch(error => console.error('Error:', error));
}

function createSuspectCard(suspect) {
    const div = document.createElement('div');
    div.className = 'suspect-card glass-effect rounded-lg shadow-xl overflow-hidden';
    
    const statusColor = 
        suspect.status === 'wanted' ? 'bg-red-500' :
        suspect.status === 'arrested' ? 'bg-yellow-500' :
        'bg-green-500';
    
    div.innerHTML = `
        <div class="relative">
            ${suspect.image_url ? 
                `<img src="${suspect.image_url}" alt="${suspect.name}" class="suspect-image">` :
                `<div class="suspect-image bg-gray-700 flex items-center justify-center">
                    <i class="fas fa-user text-6xl text-gray-500"></i>
                </div>`
            }
            <span class="absolute top-2 right-2 case-tag ${statusColor}">
                ${suspect.status}
            </span>
        </div>
        <div class="p-4">
            <h3 class="text-xl font-bold">${suspect.name}</h3>
            <p class="text-gray-400">${suspect.crime_type}</p>
            <div class="mt-2 flex items-center text-sm text-gray-400">
                <i class="fas fa-map-marker-alt mr-1"></i>
                <span>Last seen: ${suspect.last_seen || 'Unknown'}</span>
            </div>
            <button onclick="viewSuspectDetails(${suspect.id})" class="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition duration-150 ease-in-out">
                View Details
            </button>
        </div>
    `;
    return div;
}

function viewSuspectDetails(suspectId) {
    fetch(`/api/suspects/${suspectId}`)
        .then(response => response.json())
        .then(suspect => {
            // Create and show modal with suspect details
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="glass-effect rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-start">
                        <h2 class="text-2xl font-bold">${suspect.name}</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            ${suspect.image_url ? 
                                `<img src="${suspect.image_url}" alt="${suspect.name}" class="w-full h-64 object-cover rounded-lg">` :
                                `<div class="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-user text-6xl text-gray-500"></i>
                                </div>`
                            }
                        </div>
                        <div class="space-y-2">
                            <p><strong>Alias:</strong> ${suspect.alias || 'None'}</p>
                            <p><strong>Date of Birth:</strong> ${suspect.date_of_birth || 'Unknown'}</p>
                            <p><strong>Nationality:</strong> ${suspect.nationality || 'Unknown'}</p>
                            <p><strong>Status:</strong> <span class="case-tag ${
                                suspect.status === 'wanted' ? 'bg-red-500' :
                                suspect.status === 'arrested' ? 'bg-yellow-500' :
                                'bg-green-500'
                            }">${suspect.status}</span></p>
                            <p><strong>Crime Type:</strong> ${suspect.crime_type}</p>
                            <p><strong>Last Seen:</strong> ${suspect.last_seen || 'Unknown'}</p>
                        </div>
                    </div>
                    <div class="mt-6">
                        <h3 class="text-lg font-semibold mb-2">Description</h3>
                        <p class="text-gray-400">${suspect.description || 'No description available.'}</p>
                    </div>
                    ${suspect.activities && suspect.activities.length > 0 ? `
                        <div class="mt-6">
                            <h3 class="text-lg font-semibold mb-2">Criminal Activities</h3>
                            <div class="space-y-2">
                                ${suspect.activities.map(activity => `
                                    <div class="bg-gray-700 p-3 rounded-lg">
                                        <p class="font-medium">${activity.activity_type}</p>
                                        <p class="text-sm text-gray-400">${activity.description}</p>
                                        <div class="mt-1 text-sm text-gray-400">
                                            <span>${activity.date || 'Date unknown'}</span>
                                            ${activity.location ? ` • ${activity.location}` : ''}
                                            ${activity.amount_involved ? ` • Amount: $${activity.amount_involved.toLocaleString()}` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            document.body.appendChild(modal);
        })
        .catch(error => console.error('Error:', error));
}

// Search and Filter Functionality
document.getElementById('searchBtn').addEventListener('click', function() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const crimeType = document.getElementById('crimeTypeFilter').value;
    const status = document.getElementById('statusFilter').value;
    const year = document.getElementById('yearFilter').value;

    fetch('/api/suspects')
        .then(response => response.json())
        .then(suspects => {
            const filtered = suspects.filter(suspect => {
                const matchesSearch = !searchInput || 
                    suspect.name.toLowerCase().includes(searchInput) ||
                    (suspect.alias && suspect.alias.toLowerCase().includes(searchInput)) ||
                    (suspect.last_seen && suspect.last_seen.toLowerCase().includes(searchInput));
                
                const matchesCrimeType = !crimeType || suspect.crime_type === crimeType;
                const matchesStatus = !status || suspect.status === status;
                // Year filtering would need date_added from the backend
                
                return matchesSearch && matchesCrimeType && matchesStatus;
            });

            const grid = document.querySelector('#suspects-grid .grid');
            grid.innerHTML = '';
            
            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-8 text-gray-400">
                        No suspects found matching your criteria.
                    </div>
                `;
            } else {
                filtered.forEach(suspect => {
                    const card = createSuspectCard(suspect);
                    grid.appendChild(card);
                });
            }
        })
        .catch(error => console.error('Error:', error));
});

// Tip Submission
document.getElementById('tipForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        incident_type: formData.get('incident_type'),
        location: formData.get('location'),
        description: formData.get('description')
    };

    if (!data.incident_type || !data.location || !data.description) {
        alert('Please fill in all fields');
        return;
    }

    fetch('/api/tips', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert('Thank you for submitting your tip. Your information will be reviewed by our team.');
        e.target.reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit tip. Please try again.');
    });
});

// Load suspects on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSuspects();
});
