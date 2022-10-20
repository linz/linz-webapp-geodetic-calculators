linz-webapp-traverse-calculator
===============================

Package to install three javascript based calculators onto the geodetic website.  These are internal facing applications - not displayed on the public website..

The calculators are:

* nzmapconv - a javascript calculator for converting between NZGD2000 and NZGD49 based map references and geodetic coordinates
* projection-correction - converts between a projection and sea level distance for NZGD2000 based cadastral circuit projections
* traverse-calculator - calculates survey traverse miscloses either on a traverse loop or between two known coordinates.  For a closed loop also calculates the area after applying Bowditch correction.

The makefile and debian package install the applications and adds apache configuration files
into /etc/linz/geodetic/apache/linz

This assumes that the website will include a configuration command

```
  IncludeOptional /etc/linz/geodetic/apache/linz/*.conf
```

Alternatively the applications can be explicitly included by including the traverse-calculator.conf
file from that directory in the configuration.  

Each application is a defined in its own directory which can be copied to a local directory and opened to run the application locally.
