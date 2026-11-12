// Máxima universal N.º 2: presentación académica, nunca migración del perfil.
(() => {
  function ordinalNumber(value) {
    const raw = String(value ?? '').trim();
    const match = raw.match(/^(\d+)(?:[.\s]*(?:°|º|ª|er|ro|ra|do|da|to|ta|mo|ma|vo|va|no|na|o|a))*$/i);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 99) return null;
    return String(Number(match[1]));
  }
  function part(value, kind, {divisionStyle = 'standard', yearStyle = 'standard'} = {}) {
    const raw = String(value ?? '').trim();
    if (!['year', 'division', 'section'].includes(kind)) return raw;
    const number = ordinalNumber(raw);
    if (number === null) return raw;
    if (kind === 'year') return number + (yearStyle === 'legacy' ? 'º' : '°');
    if (divisionStyle === 'abbreviated') {
      const suffix = {1:'ra',2:'da',3:'ra',4:'ta',5:'ta',6:'ta',7:'ma',8:'va',9:'na',10:'ma'};
      return number + (suffix[Number(number)] || '.ª');
    }
    return number + (divisionStyle === 'bare' ? 'ª' : '.ª');
  }
  function parts(value, {legacyPacked = false} = {}) {
    if (value && typeof value === 'object') {
      if (value.adcCourseParts) return {year:String(value.adcCourseParts.year ?? ''),division:String(value.adcCourseParts.division ?? '')};
      if ('course' in value) return parts(value.course, {legacyPacked});
      return {year:String(value.year ?? ''),division:String(value.division ?? value.section ?? '')};
    }
    const raw = String(value ?? '').trim();
    if (!raw) return {year:'',division:''};
    // Sólo los consumidores históricos que ya usaban «13 = 1 / 3» lo habilitan.
    if (legacyPacked && /^[1-9][1-9]$/.test(raw)) return {year:raw[0],division:raw[1]};
    const labeled = raw.match(/^(.+?)\s+año\s*[,—–\-/]*\s*(.+?)\s+(?:división|sección)$/i);
    if (labeled) return {year:labeled[1],division:labeled[2]};
    const split = raw.match(/^(\S+?)\s*[,—–\-/]\s*(.+)$/) || raw.match(/^(\S+)\s+(.+)$/) || raw.match(/^(\d+[°º])(.+)$/);
    return split ? {year:split[1],division:split[2]} : {year:raw,division:''};
  }
  function course(value, options = {}) {
    const parsed = parts(value, options);
    const year = part(parsed.year, 'year', options);
    const division = part(parsed.division, 'division', options);
    if (options.labeled) return [year && `${year} Año`, division && `${division} División`].filter(Boolean).join(' — ');
    return [year, division].filter(Boolean).join(' ');
  }
  window.adcAcademic = Object.freeze({part, parts, course});
})();
