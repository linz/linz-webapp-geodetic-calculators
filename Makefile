# Script to install the LINZ coordinate system definition files into a standard location
#

datadir=${DESTDIR}/usr/share/linz/geodetic/
appconf=${DESTDIR}/etc/linz/geodetic/

dummy: 

# Need install to depend on something for debuild

install: dummy
	mkdir -p ${datadir}
	cp -r  traverse-calculator ${datadir}
	mkdir -p ${appconf}
	cp -r -p etc/* ${appconf}/

uninstall:

clean:
