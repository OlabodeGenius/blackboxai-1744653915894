from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from datetime import datetime
import os
import requests
from io import BytesIO
import json

app = Flask(__name__, static_folder='static')
app.config.update(
    SECRET_KEY='your-secret-key-here',  # Change this in production
    SQLALCHEMY_DATABASE_URI='sqlite:///crime_database.db',
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    UPLOAD_FOLDER='static/uploads',
    SESSION_COOKIE_SECURE=False,  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    REMEMBER_COOKIE_SECURE=False,
    REMEMBER_COOKIE_HTTPONLY=True,
    REMEMBER_COOKIE_DURATION=3600
)

# Enable CORS for development
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Models
class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class Suspect(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    alias = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    nationality = db.Column(db.String(50))
    status = db.Column(db.String(20))  # 'wanted', 'arrested', 'convicted'
    crime_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(200))
    last_seen = db.Column(db.String(100))
    date_added = db.Column(db.DateTime, default=datetime.utcnow)
    date_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CriminalActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    suspect_id = db.Column(db.Integer, db.ForeignKey('suspect.id'), nullable=False)
    activity_type = db.Column(db.String(100))
    description = db.Column(db.Text)
    date = db.Column(db.Date)
    location = db.Column(db.String(100))
    amount_involved = db.Column(db.Float)

class Tip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    incident_type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    date_submitted = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')  # pending, reviewed, actionable

@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

# Routes
@app.route('/')
def serve_frontend():
    return send_from_directory('.', 'index.html')

@app.route('/admin.html')
def serve_admin():
    return send_from_directory('.', 'admin.html')

@app.route('/admin.js')
def serve_admin_js():
    return send_from_directory('static/js', 'admin.js')

@app.route('/api/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if current_user.is_authenticated:
            return jsonify({'message': 'Already authenticated', 'authenticated': True})
        return jsonify({'message': 'Not authenticated', 'authenticated': False}), 200
    else:  # POST
        try:
            data = request.get_json()
            if not data or 'username' not in data or 'password' not in data:
                return jsonify({'error': 'Missing username or password'}), 400
            
            admin = Admin.query.filter_by(username=data['username']).first()
            if admin and bcrypt.check_password_hash(admin.password, data['password']):
                login_user(admin, remember=True)
                return jsonify({'message': 'Logged in successfully', 'authenticated': True})
            return jsonify({'error': 'Invalid credentials'}), 401
        except Exception as e:
            print(f"Login error: {str(e)}")
            return jsonify({'error': 'Server error during login'}), 500

@app.route('/api/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/suspects', methods=['GET'])
def get_suspects():
    suspects = Suspect.query.all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'status': s.status,
        'crime_type': s.crime_type,
        'image_url': s.image_url,
        'last_seen': s.last_seen
    } for s in suspects])

@app.route('/api/suspects/<int:suspect_id>', methods=['GET'])
def get_suspect(suspect_id):
    suspect = Suspect.query.get_or_404(suspect_id)
    activities = CriminalActivity.query.filter_by(suspect_id=suspect_id).all()
    
    return jsonify({
        'id': suspect.id,
        'name': suspect.name,
        'alias': suspect.alias,
        'date_of_birth': suspect.date_of_birth.strftime('%Y-%m-%d') if suspect.date_of_birth else None,
        'nationality': suspect.nationality,
        'status': suspect.status,
        'crime_type': suspect.crime_type,
        'description': suspect.description,
        'image_url': suspect.image_url,
        'last_seen': suspect.last_seen,
        'activities': [{
            'activity_type': a.activity_type,
            'description': a.description,
            'date': a.date.strftime('%Y-%m-%d') if a.date else None,
            'location': a.location,
            'amount_involved': a.amount_involved
        } for a in activities]
    })

@app.route('/api/suspects', methods=['POST'])
@login_required
def create_suspect():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['name', 'status', 'crime_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Parse date of birth
        dob = None
        if data.get('date_of_birth'):
            try:
                dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': "Invalid date_of_birth format. Please use YYYY-MM-DD."}), 400

        suspect = Suspect(
            name=data['name'],
            alias=data.get('alias'),
            date_of_birth=dob,
            nationality=data.get('nationality'),
            status=data.get('status', 'wanted'),
            crime_type=data.get('crime_type'),
            description=data.get('description'),
            image_url=data.get('image_url', '/static/default-profile.svg'),
            last_seen=data.get('last_seen')
        )
        
        db.session.add(suspect)
        db.session.commit()
        
        # Add criminal activities if provided
        if 'activities' in data:
            for activity_data in data['activities']:
                activity_date = None
                if activity_data.get('date'):
                    try:
                        activity_date = datetime.strptime(activity_data['date'], '%Y-%m-%d').date()
                    except ValueError:
                        # This error indicates a problem with activity_data date format,
                        # which should be YYYY-MM-DD as per existing logic.
                        # For robustness, we can choose to log this, skip this activity, or return an error.
                        # Here, we'll make it return an error to be consistent with date_of_birth handling.
                        return jsonify({'error': f"Invalid date format for activity: {activity_data.get('description', 'N/A')}. Please use YYYY-MM-DD."}), 400
                
                activity = CriminalActivity(
                    suspect_id=suspect.id,
                    activity_type=activity_data.get('activity_type'),
                    description=activity_data.get('description'),
                    date=activity_date,
                    location=activity_data.get('location'),
                    amount_involved=activity_data.get('amount_involved')
                )
                db.session.add(activity)
            db.session.commit()
        
        return jsonify({
            'message': 'Suspect added successfully',
            'id': suspect.id,
            'name': suspect.name,
            'status': suspect.status
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating suspect: {str(e)}")
        return jsonify({'error': 'Failed to create suspect'}), 500

@app.route('/api/suspects/<int:suspect_id>', methods=['PUT'])
@login_required
def update_suspect(suspect_id):
    suspect = Suspect.query.get_or_404(suspect_id)
    data = request.get_json()
    
    for key, value in data.items():
        if key != 'activities' and hasattr(suspect, key):
            if key == 'date_of_birth' and value:
                value = datetime.strptime(value, '%Y-%m-%d').date()
            setattr(suspect, key, value)
    
    if 'activities' in data:
        # Remove existing activities
        CriminalActivity.query.filter_by(suspect_id=suspect_id).delete()
        
        # Add new activities
        for activity_data in data['activities']:
            activity = CriminalActivity(
                suspect_id=suspect.id,
                activity_type=activity_data.get('activity_type'),
                description=activity_data.get('description'),
                date=datetime.strptime(activity_data['date'], '%Y-%m-%d').date() if activity_data.get('date') else None,
                location=activity_data.get('location'),
                amount_involved=activity_data.get('amount_involved')
            )
            db.session.add(activity)
    
    db.session.commit()
    return jsonify({'message': 'Suspect updated successfully'})

@app.route('/api/suspects/<int:suspect_id>', methods=['DELETE'])
@login_required
def delete_suspect(suspect_id):
    suspect = Suspect.query.get_or_404(suspect_id)
    
    # Delete associated activities
    CriminalActivity.query.filter_by(suspect_id=suspect_id).delete()
    
    db.session.delete(suspect)
    db.session.commit()
    return jsonify({'message': 'Suspect deleted successfully'})

@app.route('/api/tips', methods=['POST'])
def submit_tip():
    data = request.get_json()
    tip = Tip(
        incident_type=data['incident_type'],
        location=data['location'],
        description=data['description']
    )
    db.session.add(tip)
    db.session.commit()
    return jsonify({'message': 'Tip submitted successfully'}), 201

@app.route('/api/tips', methods=['GET'])
@login_required
def get_tips():
    tips = Tip.query.order_by(Tip.date_submitted.desc()).all()
    return jsonify([{
        'id': t.id,
        'incident_type': t.incident_type,
        'location': t.location,
        'description': t.description,
        'date_submitted': t.date_submitted.strftime('%Y-%m-%d %H:%M:%S'),
        'status': t.status
    } for t in tips])

@app.route('/api/tips/<int:tip_id>', methods=['PUT'])
@login_required
def update_tip_status(tip_id):
    tip = Tip.query.get_or_404(tip_id)
    data = request.get_json()
    tip.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Tip status updated successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(port=8000, debug=True)
