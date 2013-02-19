freemobile
==========

usage history webapp and backend for FreeMobile users

There are two components:
* the webapp: gui displays usage and cost data as a carousel of pages; based on swipeview.
* the backend: cron job fetches & publishes data on the server for gui to use; based on boobill.

Backend:
* needs to be configured: see `backend/config.sample`
* requires a working setup of `boobill` to fetch data from FreeMobile

Webapp:
* may to be installed using `backend/init.sh`
* may be re-published using `backend/publish.sh`
