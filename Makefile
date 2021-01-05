# Script to install the LINZ coordinate system definition files into a standard location
#

datadir=${DESTDIR}/usr/share/linz/geodetic/
appconf=${DESTDIR}/etc/linz/geodetic/


# Need install to depend on something for debuild

dummy:

install: dummy traverse-calculator-app projection-correction-app nzmapconv-app configuration

traverse-calculator-app:
	mkdir -p ${datadir}
	cp -r  traverse-calculator ${datadir}

projection-correction-app:
	mkdir -p ${datadir}
	cp -r  projection-correction ${datadir}

nzmapconv-app:
	mkdir -p ${datadir}
	cp -r  nzmapconv ${datadir}

configuration:
	mkdir -p ${appconf}
	cp -r -p etc/* ${appconf}/



uninstall:

clean:
