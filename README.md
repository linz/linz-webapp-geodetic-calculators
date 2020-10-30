linz-webapp-traverse-calculator
===============================

Package to install the LINZ internal facing traverse calculator 
application on to a server.
This installs the files and places and apache configuration file 
into /etc/linz/geodetic/apache/linz

This assumes that the website will include a configuration command

```
  IncludeOptional /etc/linz/geodetic/apache/linz/*.conf
```

Alternatively it can be explicitly included by including the traverse-calculator.conf
file from that directory in the configuration.
