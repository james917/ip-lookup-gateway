# ip-lookup-gateway
Forter gateway server test

# Step 1: Setup
 Run npm install

# Step 2: Create .ENV
 Create .env and create API access keys for both 
 api.ipstack.com
 ipapi.co
 Add to.env file created 

# Step 3: Run server 
 npm start

# Step 4: 
 Run curl command in terminal curl http://localhost:3000/get-country?ip=8.8.8.8
 the return should display {"country":"United States"}

