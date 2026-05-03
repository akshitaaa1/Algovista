from flask import Flask, request, jsonify, render_template
from algorithms.bubble_sort import bubble_sort_steps
from algorithms.selection_sort import selection_sort
from algorithms.insertion_sort import insertion_sort
from algorithms.quick_sort import quick_sort

app = Flask(__name__)


@app.route('/')
def login():
    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


@app.route('/run-algorithm', methods=['POST'])
def run_algorithm():
    data = request.get_json(silent=True) or {}

    arr = data.get("array", [])
    algo = data.get("algorithm", "")

    if not isinstance(arr, list) or not all(isinstance(x, (int, float)) for x in arr):
        return jsonify({"error": "Invalid array input"}), 400

    arr = [int(x) for x in arr]

    if len(arr) == 0:
        return jsonify({"error": "Array cannot be empty"}), 400

    steps = []

    try:
        if algo == "bubble":
            steps = bubble_sort_steps(arr[:])
        elif algo == "selection":
            steps = selection_sort(arr[:])
        elif algo == "insertion":
            steps = insertion_sort(arr[:])
        elif algo == "quick":
            steps = quick_sort(arr[:])
        else:
            return jsonify({"error": "Unsupported algorithm selected"}), 400

        if not isinstance(steps, list):
            return jsonify({"error": "Algorithm output format is invalid"}), 500

        return jsonify({"steps": steps})

    except Exception as e:
        return jsonify({"error": f"Failed to run algorithm: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
