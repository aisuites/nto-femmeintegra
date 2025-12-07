# Gunicorn configuration file
import multiprocessing

# Bind
bind = "127.0.0.1:8003"

# Workers
workers = multiprocessing.cpu_count() * 2 + 1  # Para KVM8: ~17 workers
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeouts
timeout = 30
graceful_timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/femme_integra/gunicorn_access.log"
errorlog = "/var/log/femme_integra/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "femme_integra"

# Server mechanics
daemon = False
pidfile = "/var/run/femme_integra/gunicorn.pid"
user = "femme"
group = "femme"

# Security
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190
