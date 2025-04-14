

---

```markdown
# Nigeria Crime Database Platform (NCDB)

## Project Overview
The Nigeria Crime Database Platform (NCDB) serves as a centralized online resource for accessing verified criminal records, wanted listings, and submitting anonymous tips. This web application is designed to empower citizens and assist law enforcement entities in maintaining safety and transparency across Nigeria. 

## Installation
To set up the NCDB project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nigeria-crime-database-platform
   ```

2. **Set up a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the necessary dependencies:**
   Ensure you have `Flask`, `Flask-SQLAlchemy`, and `Flask-Login` installed. You can run:
   ```bash
   pip install Flask Flask-SQLAlchemy Flask-Login Flask-Bcrypt
   ```

4. **Initialize the database and create the admin user:**
   Run the `init_admin.py` script to create the necessary database tables and default admin user.
   ```bash
   python init_admin.py
   ```

5. **Run the application:**
   Start the Flask application:
   ```bash
   python app.py
   ```
   The application will be accessible at `http://localhost:8000`.

## Usage
- **Access the main application:**
   Open your web browser and go to `http://localhost:8000` to interact with the Nigeria Crime Database Platform.
  
- **Admin Dashboard:**
   Navigate to `http://localhost:8000/admin.html` for administrative functionalities (requires login).

- **Search Suspects:**
   Use the search bar to find suspects by name, alias, or location, or filter by crime type and status.

- **Submit Tips:**
   Use the "Submit Tip" section to provide information about criminal activities anonymously.

## Features
- Search functionality for criminals based on multiple criteria.
- Submission of anonymous tips regarding criminal activities.
- Admin capabilities for managing the database of suspects and reviewing submitted tips.
- Responsive design optimized for different screen sizes.

## Dependencies
The project requires the following libraries, as defined in `package.json`:
- `Flask`
- `Flask-SQLAlchemy`
- `Flask-Login`
- `Flask-Bcrypt`
- `requests` (for making API calls)

Before running the application, ensure you have the Python environment set up with these libraries.

## Project Structure
The project contains the following files:

- `index.html`: The main frontend file where users can access the database and submit tips.
- `admin.html`: The administrative dashboard for managing suspects and tips.
- `app.py`: The main Flask application script that handles backend logic, database operations, and API endpoints.
- `init_admin.py`: A script for initializing the database and creating an admin user.
- `static/js/script.js`: JavaScript for frontend interactions (not included in provided content).
- `static/js/admin.js`: JavaScript for managing admin functionalities (not included in provided content).

Feel free to explore and customize the code to fit your requirements. For any issues or suggestions, consider contributing to the project or raising a ticket.
```
