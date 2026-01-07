"""
Pytest configuration and fixtures for E2E Selenium tests.
"""
import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By


# Environment configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://frontend:3000")
SELENIUM_HUB = os.environ.get("SELENIUM_HUB", "http://selenium-chrome:4444/wd/hub")

# Test user credentials (should match a test user in the system)
# Password must meet backend requirements: 12+ chars, upper, lower, number, special char
TEST_USERNAME = os.environ.get("TEST_USERNAME", "testuser")
TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "TestP@ssw0rd!2024")


@pytest.fixture(scope="session")
def driver():
    """
    Create a Selenium WebDriver instance connected to the remote Selenium hub.
    This fixture is session-scoped for efficiency.
    Includes retry logic for hub connection.
    """
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Retry connecting to Selenium hub
    max_retries = 5
    retry_delay = 3
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            driver = webdriver.Remote(
                command_executor=SELENIUM_HUB,
                options=chrome_options
            )
            driver.implicitly_wait(10)
            yield driver
            driver.quit()
            return
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
    
    raise last_exception or Exception("Failed to connect to Selenium hub")


@pytest.fixture(scope="session")
def base_url():
    """Return the frontend base URL."""
    return FRONTEND_URL


@pytest.fixture(scope="session")
def logged_in_driver(driver, base_url):
    """
    Fixture that ensures the driver is logged in before tests.
    Creates a test account if needed and logs in.
    """
    try:
        _perform_login_flow(driver, base_url)
        return driver
        
    except Exception as e:
        # Save failure screenshot
        _save_debug_screenshot(driver, "login_failure")
        print(f"\nLogin fixture failed. Screenshot saved to: login_failure.png")
        print(f"Current URL: {driver.current_url}")
        print(f"Page source preview: {driver.page_source[:1000]}")
        raise


def _perform_login_flow(driver, base_url):
    """Perform the complete login/signup flow."""
    driver.get(f"{base_url}/login")
    
    wait = WebDriverWait(driver, 20)
    
    # Take initial debug screenshot
    _save_debug_screenshot(driver, "debug_initial_page")
    print(f"\nDebug: Current URL = {driver.current_url}")
    print(f"Debug: Page title = {driver.title}")
    
    # Try to sign up first (in case user doesn't exist)
    _attempt_signup(driver, wait)
    
    # Now login
    _perform_login(driver, wait, base_url)


def _attempt_signup(driver, wait):
    """Attempt to create a test account."""
    try:
        signup_link = wait.until(
            EC.element_to_be_clickable((By.LINK_TEXT, "create a new account"))
        )
        signup_link.click()
        
        time.sleep(1)
        _save_debug_screenshot(driver, "debug_signup_page")
        
        # Fill signup form
        wait.until(EC.presence_of_element_located((By.ID, "username")))
        driver.find_element(By.ID, "username").send_keys(TEST_USERNAME)
        driver.find_element(By.ID, "email").send_keys(f"{TEST_USERNAME}@test.com")
        driver.find_element(By.ID, "password").send_keys(TEST_PASSWORD)
        driver.find_element(By.ID, "confirmPassword").send_keys(TEST_PASSWORD)
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        
        time.sleep(2)
        _save_debug_screenshot(driver, "debug_after_signup")
        
    except Exception as signup_error:
        print(f"\nDebug: Signup skipped/failed: {signup_error}")
        _save_debug_screenshot(driver, "debug_signup_error")


def _perform_login(driver, wait, base_url):
    """Perform login with existing account."""
    driver.get(f"{base_url}/login")
    time.sleep(1)
    _save_debug_screenshot(driver, "debug_login_page")
    
    # Wait for login form
    wait.until(EC.presence_of_element_located((By.ID, "username")))
    
    username_input = driver.find_element(By.ID, "username")
    username_input.clear()
    username_input.send_keys(TEST_USERNAME)
    
    password_input = driver.find_element(By.ID, "password")
    password_input.clear()
    password_input.send_keys(TEST_PASSWORD)
    
    _save_debug_screenshot(driver, "debug_login_filled")
    
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_btn.click()
    
    # Wait for successful login (redirect away from login page)
    wait.until(lambda d: "/login" not in d.current_url)
    
    _save_debug_screenshot(driver, "debug_login_success")
    print(f"\nDebug: Login successful, now at: {driver.current_url}")


def _save_debug_screenshot(driver, name):
    """Save a debug screenshot with consistent naming."""
    reports_dir = "/tests/reports"
    os.makedirs(reports_dir, exist_ok=True)
    screenshot_path = f"{reports_dir}/{name}.png"
    try:
        driver.save_screenshot(screenshot_path)
    except Exception as e:
        print(f"Failed to save screenshot {name}: {e}")


@pytest.fixture
def editor_page(logged_in_driver, base_url):
    """
    Fixture that navigates to the editor with a fresh example project.
    Returns the driver positioned on the editor page.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 15)
    
    # Go to dashboard
    driver.get(base_url)
    
    # Click "Create Example Project" button to get a fresh project
    example_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='create-example-btn']"))
    )
    example_btn.click()
    
    # Wait for navigation to editor (URL should contain /editor/)
    wait.until(lambda d: "/editor/" in d.current_url)
    
    # Wait for ReactFlow canvas to be ready
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".react-flow"))
    )
    
    return driver


@pytest.fixture
def empty_editor_page(logged_in_driver, base_url):
    """
    Fixture that navigates to the editor with a new empty project.
    Returns the driver positioned on the editor page.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 15)
    
    # Go to dashboard
    driver.get(base_url)
    
    # Click "New Project" button
    new_project_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='new-project-btn']"))
    )
    new_project_btn.click()
    
    # Wait for modal and fill in project name
    name_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='project-name-input']"))
    )
    name_input.send_keys(f"Test Project {os.urandom(4).hex()}")
    
    # Submit the form
    create_btn = driver.find_element(By.CSS_SELECTOR, "[data-testid='create-project-submit']")
    create_btn.click()
    
    # Wait for navigation to editor
    wait.until(lambda d: "/editor/" in d.current_url)
    
    # Wait for ReactFlow canvas to be ready
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".react-flow"))
    )
    
    return driver


@pytest.fixture
def wait_factory():
    """Factory fixture for creating WebDriverWait instances."""
    def _create_wait(driver, timeout=10):
        return WebDriverWait(driver, timeout)
    return _create_wait


@pytest.fixture
def wait_for_node_count():
    """
    Factory fixture that waits for node count to reach expected value.
    Returns a function that can be called with driver, expected_count, and timeout.
    """
    def _wait_for_nodes(driver, min_count, timeout=10):
        """Wait until at least min_count nodes are present."""
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.common.by import By
        
        def check_node_count(d):
            nodes = d.find_elements(By.CSS_SELECTOR, ".react-flow__node")
            return len(nodes) >= min_count
        
        WebDriverWait(driver, timeout).until(check_node_count)
        return driver.find_elements(By.CSS_SELECTOR, ".react-flow__node")
    
    return _wait_for_nodes


# Screenshot on failure hook
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Take a screenshot on test failure."""
    outcome = yield
    report = outcome.get_result()
    
    if report.when == "call" and report.failed:
        # Try to get driver from various fixtures
        driver = (
            item.funcargs.get("editor_page") or
            item.funcargs.get("empty_editor_page") or
            item.funcargs.get("logged_in_driver") or
            item.funcargs.get("driver")
        )
        if driver:
            test_name = item.name
            _save_debug_screenshot(driver, f"{test_name}_failure")
            print(f"\nScreenshot saved to: {test_name}_failure.png")
