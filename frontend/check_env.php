<?php
echo "PHP Version: " . phpversion() . "\n";
echo "PDO Loaded: " . (extension_loaded('pdo') ? 'Yes' : 'No') . "\n";
echo "PDO MySQL Loaded: " . (extension_loaded('pdo_mysql') ? 'Yes' : 'No') . "\n";
echo "PDO Class Exists: " . (class_exists('PDO') ? 'Yes' : 'No') . "\n";
?>
