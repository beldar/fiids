Fiids
=====

How to install/run
==================

Install Meteor

	curl https://install.meteor.com | /bin/sh

Create project

	meteor create fiidsapp

Copy source

	cd fiidsapp
	git clone https://github.com/beldar/fiids.git .

Add packages

	meteor add bootstrap
	meteor add jquery
	meteor add accounts-base
	meteor add accounts-password
	meteor add accounts-ui
	meteor remove insecure
	meteor remove autopublish

Run app

	meteor
