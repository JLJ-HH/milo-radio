@echo off
echo Starting git resolution... > git_log.txt
git add backend/api/auth.php >> git_log.txt 2>&1
echo Adding backend/api/auth.php done. >> git_log.txt
git rm -f api/auth.php >> git_log.txt 2>&1
echo Removing api/auth.php done. >> git_log.txt
git commit -m "Merge branch 'umzug' into main: Resolving conflict in auth.php and completing restructure" >> git_log.txt 2>&1
echo Commit done. >> git_log.txt
git push origin main >> git_log.txt 2>&1
echo Push done. >> git_log.txt
echo Finished. >> git_log.txt
