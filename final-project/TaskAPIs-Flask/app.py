import os
from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import CORS
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)

# Base directory for the project
basedir = os.path.abspath(os.path.dirname(__file__))

# Ensure the 'instance' directory exists
instance_path = os.path.join(basedir, 'instance')
if not os.path.exists(instance_path):
    os.makedirs(instance_path)

# Configure the app
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "app2.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')

db = SQLAlchemy(app)
CORS(app)
jwt = JWTManager(app)


# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    desc = db.Column(db.String(200))
    status = db.Column(db.String(50), default='Pending')
    priority = db.Column(db.String(50))
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)

    subtasks = db.relationship('Subtask', backref='task', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Task {self.title}>'


class Subtask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    done = db.Column(db.Boolean, default=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)

    def __repr__(self):
        return f'<Subtask {self.name}>'


# Create the database tables
# with app.app_context():
#     db.create_all()

# Routes
@app.route('/')
def index():
    users = User.query.all()
    return render_template('index.html', users=users)


# Add User Route For Flask App
@app.route('/user', methods=['POST'])
def add_user():
    username = request.form['username']
    password = request.form['password']
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()
    return redirect(url_for('index'))


# Delete User Route For Flask App
@app.route('/user/<int:id>')
def delete_user(uid):
    user = User.query.get(uid)
    db.session.delete(user)
    db.session.commit()
    return redirect(url_for('index'))


# User registration route for API for Angular App
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User created successfully"), 201


# User login route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.password == data['password']:
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token)
    return jsonify(message="Invalid credentials"), 401


# Get all tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'desc': task.desc,
        'status': task.status,
        'priority': task.priority,
        'startDate': task.start_date.strftime('%Y-%m-%d') if task.start_date else None,
        'endDate': task.end_date.strftime('%Y-%m-%d') if task.end_date else None,
        'subtasks': [{'id': subtask.id, 'name': subtask.name, 'done': subtask.done} for subtask in task.subtasks]
    } for task in tasks])


# Get a specific task by ID
@app.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    task_data = {
        'id': task.id,
        'title': task.title,
        'desc': task.desc,
        'status': task.status,
        'priority': task.priority,
        'startDate': task.start_date.strftime('%Y-%m-%d') if task.start_date else None,
        'endDate': task.end_date.strftime('%Y-%m-%d') if task.end_date else None,
        'subtasks': [{'id': subtask.id, 'name': subtask.name, 'done': subtask.done} for subtask in task.subtasks]
    }
    return jsonify(task_data)


# Create a new task
@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    title = data['title']
    desc = data.get('desc')
    status = data.get('status', 'Pending')
    priority = data.get('priority')
    start_date = data.get('startDate')
    end_date = data.get('endDate')

    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')

    task = Task(title=title, desc=desc, status=status, priority=priority, start_date=start_date, end_date=end_date)
    db.session.add(task)
    db.session.commit()

    c_task = Task.query.get_or_404(task.id)
    subtasks = data.get('subtasks')
    for sub in subtasks:
        name = sub.get('name')
        done = sub.get('done', False)
        subtask = Subtask(name=name, done=done, task_id=c_task.id)
        db.session.add(subtask)
        db.session.commit()
    return jsonify(message="Task created successfully"), 201


# Update a task
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    print("upData",data)

    task.title = data.get('title', task.title)
    task.desc = data.get('desc', task.desc)
    task.status = data.get('status', task.status)
    task.priority = data.get('priority', task.priority)

    start_date = data.get('startDate')
    if start_date:
        task.start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = data.get('endDate')
    if end_date:
        task.end_date = datetime.strptime(end_date, '%Y-%m-%d')

    # Handle subtasks
    subtasks_data = data.get('subtasks', [])
    current_subtasks = {subtask.id: subtask for subtask in task.subtasks}

    for subtask_data in subtasks_data:
        subtask_id = subtask_data.get('id')
        if subtask_id:
            # Update existing subtask
            subtask = current_subtasks.pop(subtask_id, None)
            if subtask:
                subtask.name = subtask_data.get('name', subtask.name)
                subtask.done = subtask_data.get('done', subtask.done)
        else:
            # Add new subtask
            subtask = Subtask(
                name=subtask_data['name'],
                done=subtask_data.get('done', False),
                task_id=task.id
            )
            db.session.add(subtask)

    # Delete removed subtasks
    for subtask in current_subtasks.values():
        db.session.delete(subtask)

    db.session.commit()
    return jsonify(message="Task updated successfully")


# Delete a task
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify(message="Task deleted successfully")


# Get all subtasks
@app.route('/subtasks', methods=['GET'])
def get_all_subtasks():
    subtasks = Subtask.query.all()
    return jsonify([{
        'id': subtask.id,
        'name': subtask.name,
        'done': subtask.done,
        'task_id': subtask.task_id
    } for subtask in subtasks])


# Get subtasks for a task
@app.route('/tasks/<int:task_id>/subtasks', methods=['GET'])
def get_subtasks(task_id):
    task = Task.query.get_or_404(task_id)
    subtasks = Subtask.query.filter_by(task_id=task.id).all()
    return jsonify([{
        'id': subtask.id,
        'name': subtask.name,
        'done': subtask.done
    } for subtask in subtasks])


# Add a subtask to a task
@app.route('/tasks/<int:task_id>/subtasks', methods=['POST'])
def add_subtask(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    name = data['name']
    done = data.get('done', False)
    subtask = Subtask(name=name, done=done, task_id=task.id)
    db.session.add(subtask)
    db.session.commit()
    return jsonify(message="Subtask created successfully"), 201


# Update a subtask
@app.route('/subtasks/<int:subtask_id>', methods=['PUT'])
def update_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    data = request.get_json()
    subtask.name = data.get('name', subtask.name)
    subtask.done = data.get('done', subtask.done)
    db.session.commit()
    return jsonify(message="Subtask updated successfully")


# Delete a subtask
@app.route('/subtasks/<int:subtask_id>', methods=['DELETE'])
def delete_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    db.session.delete(subtask)
    db.session.commit()
    return jsonify(message="Subtask deleted successfully")


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
