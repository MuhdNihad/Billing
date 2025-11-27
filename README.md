# Billing Application

This project is a full-stack web application for managing billing, inventory, and expenses. It features a React frontend and a Python (FastAPI) backend.

## Setting Up for a New Device

### 1. Database Setup (MongoDB)

This project uses MongoDB as its database. You will need to have a MongoDB server running. You can use a local MongoDB server or a cloud-based service like MongoDB Atlas.

1.  **Create a database:** Create a new database in your MongoDB server.
2.  **Database Name:** The name of the database should be set in the `DB_NAME` environment variable in the `backend/.env` file.
3.  **Collections:** The application will automatically create the following collections when it runs for the first time:
    *   `categories`
    *   `products`
    *   `product_sets`
    *   `expense_categories`
    *   `expenses`
    *   `sales`

### 2. Backend Setup (Python/FastAPI)

1.  **Navigate to the backend directory:**
    ```shell
    cd backend
    ```
2.  **Create a `.env` file:** Create a `.env` file in the `backend` directory by copying the `.env.example` file.
    ```shell
    cp .env.example .env
    ```
3.  **Update the `.env` file:** Update the `MONGO_URL` and `DB_NAME` variables in the `.env` file with your MongoDB connection string and database name.
4.  **Create and activate a virtual environment.** This keeps your project's dependencies isolated.
    *   On Windows:
        ```shell
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```shell
        python3 -m venv venv
        source venv/bin/activate
        ```
5.  **Install the required Python packages:**
    ```shell
    pip install -r requirements.txt
    ```

### 3. Frontend Setup (React)

1.  **Navigate to the frontend directory:**
    ```shell
    cd frontend
    ```
2.  **Create a `.env` file:** Create a `.env` file in the `frontend` directory by copying the `.env.example` file.
    ```shell
    cp .env.example .env
    ```
3.  **Update the `.env` file:** Update the `REACT_APP_API_URL` variable in the `.env` file with the URL of your backend API (e.g., `http://127.0.0.1:8000`).
4.  **Install the necessary Node.js packages:**
    ```shell
    yarn install
    ```

## How to Run the Project

You will need two separate terminal windows to run both the backend API and the frontend application simultaneously.

---

### 1. Run the Backend (Python/FastAPI)

1.  **Navigate to the backend directory:**
    ```shell
    cd backend
    ```
2.  **Activate the virtual environment.**
    *   On Windows:
        ```shell
        .\venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```shell
        source venv/bin/activate
        ```
3.  **Run the FastAPI server:**
    This command starts the backend API, which will automatically reload on code changes.
    ```shell
    uvicorn server:app --reload
    ```
    Your backend should now be running, typically at `http://127.0.0.1:8000`.

---

### 2. Run the Frontend (React)

1.  **Navigate to the frontend directory:**
    ```shell
    cd frontend
    ```
2.  **Start the React development server:**
    ```shell
    yarn start
    ```
    This will open a new tab in your web browser with the application, usually at `http://localhost:3000`. The frontend is configured to connect to the backend API.

## Testing

### Backend Tests

The backend tests are located in the `backend_test.py` file. These tests are designed to be run against a running backend server.

1.  **Make sure the backend server is running.**
2.  **Navigate to the root directory of the project.**
3.  **Run the tests:**
    ```shell
    python backend_test.py
    ```
The tests will run and print the results to the console. The script will exit with a status code of 0 if all tests pass, and 1 if any tests fail.