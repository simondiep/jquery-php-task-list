<?php 

    // First we execute our common code to connection to the database and start the session 
    require("common.php"); 
    
    $ERROR_USERNAME = '';
    $ERROR_PASSWORD = '';
    $ERROR_EMAIL = '';
    $ERROR_CAPTCHA = '';
    // This if statement checks to determine whether the registration form has been submitted 
    // If it has, then the registration code is run, otherwise the form is displayed 
    if(!empty($_POST)) 
    {
        // Ensure that the user has entered a non-empty username 
        if(empty($_POST['username'])) 
        { 
            $ERROR_USERNAME='Please enter a username.'; 
        } 
        
        // Ensure that the user has entered a non-empty password 
        if(empty($_POST['password'])) 
        { 
            $ERROR_PASSWORD='Please enter a password.'; 
        } 
        // Make sure the user entered a valid E-Mail address 
        // filter_var is a useful PHP function for validating form input, see: 
        // http://us.php.net/manual/en/function.filter-var.php 
        // http://us.php.net/manual/en/filter.filters.php 
        if(!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) 
        { 
            $ERROR_EMAIL='Invalid E-Mail Address'; 
        } 
        
        //session_start();
        if(isset($_POST["captcha"])&&$_POST["captcha"]!=""&&$_SESSION["code"]==$_POST["captcha"])
        {
            //Correct captcha
        } else {
            $ERROR_CAPTCHA='Invalid Captcha'; 
        }
        if(empty($ERROR_USERNAME) && empty($ERROR_PASSWORD) && empty($ERROR_EMAIL) && empty($ERROR_CAPTCHA)){
            // We will use this SQL query to see whether the username entered by the 
            // user is already in use.  A SELECT query is used to retrieve data from the database. 
            // :username is a special token, we will substitute a real value in its place when 
            // we execute the query. 
            $query = " 
                SELECT 1 FROM user 
                WHERE username = :username"; 
             
            // This contains the definitions for any special tokens that we place in 
            // our SQL query.  In this case, we are defining a value for the token 
            // :username.  It is possible to insert $_POST['username'] directly into 
            // your $query string; however doing so is very insecure and opens your 
            // code up to SQL injection exploits.  Using tokens prevents this. 
            // For more information on SQL injections, see Wikipedia: 
            // http://en.wikipedia.org/wiki/SQL_Injection 
            $query_params = array( 
                ':username' => $_POST['username'] 
            ); 
            try 
            { 
                // These two statements run the query against your database table. 
                $stmt = $db->prepare($query); 
                $result = $stmt->execute($query_params); 
            } 
            catch(PDOException $ex) 
            { 
                // Note: On a production website, you should not output $ex->getMessage(). 
                // It may provide an attacker with helpful information about your code.  
                die("Failed to run query: " . $ex->getMessage()); 
            } 
             
            // The fetch() method returns an array representing the "next" row from 
            // the selected results, or false if there are no more rows to fetch. 
            $row = $stmt->fetch(); 
             
            // If a row was returned, then we know a matching username was found in 
            // the database already and we should not allow the user to continue. 
            if($row) 
            { 
                $ERROR_USERNAME='This username is already in use'; 
            } 
             
            // Now we perform the same type of check for the email address, in order 
            // to ensure that it is unique. 
            $query = " 
                SELECT 1 FROM user
                WHERE email = :email"; 
             
            $query_params = array( 
                ':email' => $_POST['email'] 
            ); 
             
            try 
            { 
                $stmt = $db->prepare($query); 
                $result = $stmt->execute($query_params); 
            } 
            catch(PDOException $ex) 
            { 
                die("Failed to run query: " . $ex->getMessage()); 
            } 
            $row = $stmt->fetch(); 
             
            if($row) 
            { 
                $ERROR_EMAIL='This email address is already registered'; 
            }
            
            if(empty($ERROR_USERNAME) && empty($ERROR_EMAIL)){
                // An INSERT query is used to add new rows to a database table. 
                // Again, we are using special tokens (technically called parameters) to 
                // protect against SQL injection attacks. 
                $query = " 
                    INSERT INTO user ( 
                        username, 
                        password, 
                        salt, 
                        email 
                    ) VALUES ( 
                        :username, 
                        :password, 
                        :salt, 
                        :email 
                    ) 
                "; 
                 
                // A salt is randomly generated here to protect again brute force attacks 
                // and rainbow table attacks.  The following statement generates a hex 
                // representation of an 8 byte salt.  Representing this in hex provides 
                // no additional security, but makes it easier for humans to read. 
                // For more information: 
                // http://en.wikipedia.org/wiki/Salt_%28cryptography%29 
                // http://en.wikipedia.org/wiki/Brute-force_attack 
                // http://en.wikipedia.org/wiki/Rainbow_table 
                $salt = dechex(mt_rand(0, 2147483647)) . dechex(mt_rand(0, 2147483647)); 
                 
                // This hashes the password with the salt so that it can be stored securely 
                // in your database.  The output of this next statement is a 64 byte hex 
                // string representing the 32 byte sha256 hash of the password.  The original 
                // password cannot be recovered from the hash.  For more information: 
                // http://en.wikipedia.org/wiki/Cryptographic_hash_function 
                $password = hash('sha256', $_POST['password'] . $salt); 
                 
                // Next we hash the hash value 65536 more times.  The purpose of this is to 
                // protect against brute force attacks.  Now an attacker must compute the hash 65537 
                // times for each guess they make against a password, whereas if the password 
                // were hashed only once the attacker would have been able to make 65537 different  
                // guesses in the same amount of time instead of only one. 
                for($round = 0; $round < 65536; $round++) 
                { 
                    $password = hash('sha256', $password . $salt); 
                } 
                 
                // Here we prepare our tokens for insertion into the SQL query.  We do not 
                // store the original password; only the hashed version of it.  We do store 
                // the salt (in its plaintext form; this is not a security risk). 
                $query_params = array( 
                    ':username' => $_POST['username'], 
                    ':password' => $password, 
                    ':salt' => $salt, 
                    ':email' => $_POST['email'] 
                ); 
                 
                try 
                { 
                    // Execute the query to create the user 
                    $stmt = $db->prepare($query); 
                    $result = $stmt->execute($query_params); 
                } 
                catch(PDOException $ex) 
                { 
                    // Note: On a production website, you should not output $ex->getMessage(). 
                    // It may provide an attacker with helpful information about your code.  
                    die("Failed to run query: " . $ex->getMessage()); 
                } 
                 
                // This redirects the user back to the signin page after they register 
                header("Location: signin.php"); 
                 
                // Calling die or exit after performing a redirect using the header function 
                // is critical.  The rest of your PHP script will continue to execute and 
                // will be sent to the user if you do not die or exit. 
                die("Redirecting to signin.php"); 
            }
        } 
    }
     
?> 
<head>
    <meta name="viewport" content="initial-scale=1.0">
    <meta charset="utf-8">
    <title>Task List</title>
    <link rel="stylesheet" type="text/css" href="css/bootstrap.css" media="screen" />
    <link rel="stylesheet" href="css/index.css" />
    <link rel="icon" href="assets/favicon.ico" type="image/x-icon" />
</head> 
<body class="lighted-night-background">
    <header>
        <h1>Register</h1> 
    </header>
    <div class="container-narrow jumbotron">
        <form action="register.php" method="post"> 
            <?php if (!empty($ERROR_USERNAME)) : ?>
                <span class="validation-message"><?php echo htmlentities($ERROR_USERNAME, ENT_QUOTES, 'UTF-8'); ?></span>
            <?php endif; ?>
            <div class="form-group">
                <label class="sr-only" for="usernameTextField">Username</label>
                <input name="username" type="text" class="form-control" id="usernameTextField" placeholder="Username" value="" pattern=".{3,}" required title="3 character minimum"/>
            </div>
            <?php if (!empty($ERROR_EMAIL)) : ?>
                <span class="validation-message"><?php echo htmlentities($ERROR_EMAIL, ENT_QUOTES, 'UTF-8'); ?></span>
            <?php endif; ?>
            <div class="form-group">
                <label class="sr-only" for="emailTextField">Email Address</label>
                <input name="email" type="email" class="form-control" id="emailTextField" placeholder="Email Address" value="" required/>
            </div>
            <?php if (!empty($ERROR_PASSWORD)) : ?>
                <span class="validation-message"><?php echo htmlentities($ERROR_PASSWORD, ENT_QUOTES, 'UTF-8'); ?></span>
            <?php endif; ?>
            <div class="form-group">
                <label class="sr-only" for="passwordTextField">Password</label>
                <input name="password" type="password" class="form-control" id="passwordTextField" placeholder="Password" value="" pattern=".{8,}" required title="8 character minimum"/>
            </div>
            <div class="form-group">
                <label class="sr-only" for="captchaTextField">Enter the text from the image</label>
                <div class="row">
                    <div class="col-xs-4">
                        <input name="captcha" type="text" class="form-control" id="captchaTextField" placeholder="Enter code" value="" value="" required/>
                    </div>
                    <div class="col-xs-3">
                        <img src="captcha.php" class="form-control" />
                    </div>
                    <?php if (!empty($ERROR_CAPTCHA)) : ?>
                        <div class="col-xs-5">
                            <span class="validation-message"><?php echo htmlentities($ERROR_CAPTCHA, ENT_QUOTES, 'UTF-8'); ?></span>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            <button id='registerButton' type="submit" class="btn btn-default pull-right">Register</button>
        </form>
        <button id='backToLoginButton' class="btn btn-default pull-left" onclick="location.href = 'signin.php'">Back to Sign in</button>
    </div>
</body>