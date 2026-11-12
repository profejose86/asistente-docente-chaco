"""Extrae la referencia documental; no modifica ni conecta formularios."""
import hashlib
import json
import re
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'docs' / 'referencias'
SOURCE = DEST / 'Nomenclatura.pdf'
groups = {'1': 'Licencias por razones de salud', '2': 'Otras licencias', '3': 'Permisos', '4': 'Sanciones (descripción editorial; encabezado no identificado)'}
records = []
names = {}
shared_legal = {}
texts = []
with pdfplumber.open(SOURCE) as pdf:
    for page_number, page in enumerate(pdf.pages, 1):
        texts.append(f'--- PAGINA {page_number} ---\n{page.extract_text() or ""}')
        for table in page.find_tables():
            extracted = table.extract()
            for row, raw in zip(table.rows, extracted):
                if len(raw) < 8:
                    continue
                # Some overflowing labels enter the first digit cell in the PDF.
                components = [re.sub(r'\D', '', raw[i] or '') for i in (1, 2, 3)]
                if not all(components) or components[0] not in groups:
                    continue
                values = []
                used_cells = set()
                for i, cell in enumerate(row.cells):
                    if cell is None:
                        # Resolve vertically merged cells using the column's position.
                        anchor = next((r.cells[i] for r in table.rows if len(r.cells) > i and r.cells[i]), None)
                        if anchor:
                            x = anchor[0] + 0.1
                            digit_cell = row.cells[1]
                            y = (digit_cell[1] + digit_cell[3]) / 2
                            cell = next((c for c in table.cells if c[0] <= x <= c[2] and c[1] <= y <= c[3]), None)
                    if cell and cell not in used_cells:
                        value = raw[i] if row.cells[i] is not None else page.crop(cell).extract_text()
                        values.append(' '.join((value or '').split()))
                        used_cells.add(cell)
                    else:
                        values.append('')
                group, motive, variant = components
                key = (group, motive)
                if values[0] and key not in names:
                    names[key] = values[0]
                if values[4]:
                    shared_legal[key] = values[4]
                records.append(dict(pagina=page_number, agrupacion=group, componentesCodigo=components,
                    codigo=''.join(components), clave='-'.join(components), motivoClave='-'.join(key),
                    denominacion=names.get(key, ''), encuadreLegal=values[4] or shared_legal.get(key, ''),
                    situacionRevistaOriginal=values[5], formaPago=values[6],
                    otorgadoPor=values[7] if len(values)>8 else '',
                    observaciones=' | '.join(v for v in values[8:] if v),
                    estado='referencia documental; pendiente de integración y validación normativa'))

# Resolve labels and merged legal cells split across page boundaries.
names[('1', '6')] = 'PRORROGA LIC. POR RAZONES DE SALUD'
names[('1', '8')] = 'TRASLADO TRANSITORIO (RAZONES [texto recortado en el PDF])'
names[('2', '19')] = 'Comité Prov. De Prev. De la Tortura y Otros Tratos y Penas Crueles y/o Degradante'
for record in records:
    key = tuple(record['motivoClave'].split('-'))
    record['denominacion'] = names[key]
    if key == ('2', '18'):
        record['encuadreLegal'] = 'Ley 3656 RES.5128/07'
    if record['clave'] == '2-18-4':
        # The final 7 of RES.5128/07 overflows into the next extracted cell.
        record['situacionRevistaOriginal'] = 'Interino'
    original = record['situacionRevistaOriginal']
    record['situacionRevista'] = {'Interno': 'Interino', 'interino': 'Interino', 'Interina': 'Interino'}.get(original, original)

assert len({r['clave'] for r in records}) == len(records)
assert next(r for r in records if r['codigo']=='111')['encuadreLegal'] == '309-B 1)'
assert next(r for r in records if r['clave']=='1-6-10')['codigo'] == '1610'
assert all(r['situacionRevista'] in ['Titular', 'Interino', 'Suplente', 'Funcionario Político'] for r in records)
result = dict(fuente='Nomenclatura.pdf', sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    paginas=7, fechaIncorporacion='2026-11-11', agrupaciones=groups,
    advertencias=[
        'Código de nomenclatura y encuadre legal son columnas diferentes. No equivalen automáticamente a número de ley.',
        'Se conservan los tres componentes, incluido un componente de dos dígitos; usar clave con separadores como identificador.',
        'No inferir la variante únicamente de la situación de revista: también existen prórrogas, porcentajes y grados de parentesco.',
        'Texto recortado en traslado transitorio; Interno en 2-21-2 se normaliza a Interino y se conserva original.',
        'No se acredita fecha de actualización ni vigencia normativa. El grupo 2 salta del motivo 11 al 13 en el original.',
        'Grupo 4 documental adicional, no ofrecer como licencia solicitada por docente.',
        'Campos vacíos se mantienen; celdas combinadas se propagan dentro del mismo motivo.'],
    aclaracionDuelo=texts[5], registros=records)
(DEST / 'nomenclatura-licencias.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(DEST / 'nomenclatura-texto.txt').write_text('\n\n'.join(texts)+'\n', encoding='utf-8')
lines=['# Catálogo documental de licencias y permisos', '',
    'Fuente: [Nomenclatura.pdf](Nomenclatura.pdf), 7 páginas. Incorporado el 11/11/2026.', '',
    'Referencia para desarrollar formularios; no está conectada a la aplicación. No se verificó vigencia normativa.', '',
    '## Criterios y puntos pendientes', '']
lines += ['- '+a for a in result['advertencias']]
lines += ['', 'El usuario propone usar el código en campos de DJ-01 y OL-01, incluido «ley número». Antes de programarlo, cotejar cada etiqueta con la plantilla: 111 es el código y 309-B 1) el encuadre legal de enfermedad común para titular. Conservar ambos y evitar sustituir uno por otro automáticamente.', '',
    'El PDF también incluye Funcionario Político. Para seleccionar una variante hacen falta motivo, situación de revista y condiciones específicas; no tomar siempre la primera fila.', '',
    'La aclaración de duelo de la página 6 se conserva literalmente en el TXT y JSON. Sus grados no se reinterpretan como reglas jurídicas.', '']
for group, label in groups.items():
    subset=[r for r in records if r['agrupacion']==group]
    lines += [f'## {label} ({len(subset)} variantes)', '', '| Código | Componentes | Denominación | Revista original | Encuadre legal | Pago | Otorga | Observaciones | Pág. |', '|---|---|---|---|---|---|---|---|---|']
    for r in subset:
        fields=[r['codigo'],r['clave'],r['denominacion'],r['situacionRevistaOriginal'],r['encuadreLegal'],r['formaPago'],r['otorgadoPor'],r['observaciones'],str(r['pagina'])]
        lines.append('| '+' | '.join(f.replace('|',';') for f in fields)+' |')
    lines.append('')
(DEST / 'nomenclatura-licencias.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps({'registros':len(records),'motivos':len(names),'porAgrupacion':{g:sum(r['agrupacion']==g for r in records) for g in groups}},ensure_ascii=True))
