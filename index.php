<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="origin-when-cross-origin">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>atms</title>
    <!-- Favicon -->


    <link rel="preload" as="style" href="assets/css/top.css">
    <link rel="stylesheet" href="assets/css/top.css">
    <link rel="stylesheet" href="assets/css/libs.css.php">
    <link rel="stylesheet" href="assets/css/app.css">
    <link rel="stylesheet" href="assets/css/bottom.css">
</head>

<body>

    <?php require("templates/sidebar.php"); ?>

    <main>
        <?php require("templates/" . $_GET["p"] . ".php"); ?>
    </main>

    <script defer src="assets/js/libs.js.php"></script>
    <script defer src="assets/js/utils/functions.js"></script>
    <script defer src="assets/js/main.js"></script>
</body>

</html>