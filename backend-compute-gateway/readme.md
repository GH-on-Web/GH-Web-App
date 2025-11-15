This backend is for accessing our rhino compute server from the frontend.

To run this backend, you will need to set the following environment variables:
- RHINO_COMPUTE_URL
- RHINO_COMPUTE_KEY


There are two route types:
 1. computeProxy
    - This is a proxy for the compute server
    - It will forward requests to the compute server
    - It will forward responses from the compute server
 2. scripts
    - This is a route for running specific scripts in the ./scripts directory with a front end provided input. 

    - It will forward requests as input + the script to the compute surver
    -recives compute output and passes it to the frontend

There are only a couple basic routes

- /computeProxy
- /scripts/compute-json-to-gh 
- /scripts/compute-gh-to-json 


