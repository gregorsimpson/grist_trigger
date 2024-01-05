  function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const colName_table = 'Table';
const colName_column = 'Column';
const colName_id = 'ID';
const colName_trigger = 'Trigger';
var tableId = null;
let app = undefined;
let data = {
  status: 'Please select a record.'
}

function handleError(err) {
  console.error('ERROR', err);
  data.status = String(err).replace(/^Error: /, '');
}

async function onRecord(record, mappedColNamesToRealColNames) {
  try {
    const record_mapped = grist.mapColumnNames(record);
    // First check if all columns were mapped.
    if (record_mapped) {
      let isTriggered = record_mapped[colName_trigger];
      if (isTriggered) {
        let triggerColumnName = mappedColNamesToRealColNames[colName_trigger];
        let tableName = record_mapped[colName_table];
        let id = record_mapped[colName_id];
        let columnName = record_mapped[colName_column];
        let tableData = await grist.docApi.fetchTable(tableName);
        let i = tableData.id.indexOf(id);
        let value = tableData[columnName][i];
        //data.status = `value is "${value}"`;
        if (!value) {
          await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
            [triggerColumnName]: false
          }]]);
          await grist.docApi.applyUserActions([['UpdateRecord', tableName, id, {
            [columnName]: true
          }]]);
        }
      }
      data.status = `All done. isTriggered="${isTriggered}" actual="${record.trigger_the_trigger}"`;
    } else {
      // Helper returned a null value. It means that not all
      // required columns were mapped.
      throw new Error(`Please map all required columns first.`);
    }
  } catch (err) {
    handleError(err);
  }
}

ready(async function() {
  await grist.onRecord(onRecord);
  grist.on('message', (e) => {
    if (e.tableId) { tableId = e.tableId; }
  });
  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data
  });
  grist.ready({
    requiredAccess: "full",
    allowSelectBy: true,
    columns: [
      {name: colName_table, title: "Table (name of the)"},
      {name: colName_column, title: "Column (name of the)"},
      {name: colName_id, title: "ID (of the target record)"},
      {name: colName_trigger, title: "Trigger (bool)"}
    ]
  });
});
