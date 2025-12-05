// Script para eliminar registros duplicados por CB
// Uso: npm run delete-duplicate -- 1009395
// Uso múltiple: npm run delete-duplicate -- 1009394 1009395

import { supabase } from '../lib/supabase';

async function deleteDuplicateCB(cb: string) {
  try {
    console.log(`\n🔍 Buscando registros con CB = ${cb}...`);
    
    // Verificar si existe
    const { data: existing, error: selectError } = await supabase
      .from('repuestos')
      .select('*')
      .eq('cb', cb);

    if (selectError) {
      console.error('❌ Error al buscar:', selectError);
      return false;
    }

    if (!existing || existing.length === 0) {
      console.log(`✓ No se encontraron registros con CB = ${cb}`);
      return true;
    }

    console.log(`\n📋 Se encontraron ${existing.length} registro(s):`);
    existing.forEach((record, index) => {
      console.log(`\n  Registro ${index + 1}:`);
      console.log(`    CB: ${record.cb}`);
      console.log(`    CI: ${record.ci}`);
      console.log(`    Producto: ${record.producto}`);
      console.log(`    Fecha creación: ${record.fecha_creacion}`);
    });

    // Eliminar
    console.log(`\n🗑️  Eliminando registro(s) con CB = ${cb}...`);
    const { error: deleteError } = await supabase
      .from('repuestos')
      .delete()
      .eq('cb', cb);

    if (deleteError) {
      console.error('❌ Error al eliminar:', deleteError);
      return false;
    }

    console.log(`✅ Registro(s) eliminado(s) exitosamente`);

    // Verificar que se eliminó
    const { data: verify } = await supabase
      .from('repuestos')
      .select('*')
      .eq('cb', cb);

    if (!verify || verify.length === 0) {
      console.log(`✓ Verificado: No quedan registros con CB = ${cb}\n`);
      return true;
    } else {
      console.log(`⚠️  Advertencia: Aún quedan ${verify.length} registro(s) con CB = ${cb}\n`);
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function main() {
  // Obtener los CBs de los argumentos de línea de comandos
  const cbs = process.argv.slice(2);

  if (cbs.length === 0) {
    console.error('❌ Error: Debes proporcionar al menos un CB');
    console.log('Uso: npm run delete-duplicate -- 1009395');
    console.log('Uso múltiple: npm run delete-duplicate -- 1009394 1009395');
    process.exit(1);
  }

  console.log(`\n🚀 Eliminando ${cbs.length} CB(s)...\n`);

  let successCount = 0;
  for (const cb of cbs) {
    const success = await deleteDuplicateCB(cb);
    if (success) successCount++;
  }

  console.log(`\n✅ Proceso completado: ${successCount}/${cbs.length} CBs eliminados exitosamente\n`);
}

main();
