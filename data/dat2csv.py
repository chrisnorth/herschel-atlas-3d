from astropy.table import Table

table = Table.read('HATLAS_time_core.dat',format='ascii')

table.write('HATLAS_time_core.csv',format='ascii.csv')


