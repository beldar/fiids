Fiids
=====

How to install/run
==================

Install Meteor

	curl https://install.meteor.com | /bin/sh

Create project

	meteor create fiidsapp

Get source

	git clone https://github.com/beldar/fiids.git fiidsrc

Remove default files from project

        cd fiidsapp
        rm *


Put source files to meteor folder

        mv ../fiidsrc/* ../fiidsapp/

If you want to continue git version control copy the .git folder

        mv ../fiidsrc/.git/* ../fiidsapp/.git/

Add packages

	meteor add bootstrap
	meteor add jquery
	meteor add accounts-base
	meteor add accounts-password
	meteor add accounts-ui
        meteor add http
	meteor remove insecure
	meteor remove autopublish

Run app

	meteor
