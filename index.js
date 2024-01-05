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
var tableId = null;
let app = undefined;
let data = {
  status: 'Please select a record.',
  userActions: null,
  trigger: false,
  setSelectedRows: null
}

function handleError(err) {
  console.error('ERROR', err);
  data.status = String(err).replace(/^Error: /, '');
}

async function onRecord(record, mappings) {
  try {
    const mapped = grist.mapColumnNames(record);
    // First check if all columns were mapped.
    if (mapped) {
      /*colId = mappings[colName_table];
      colId2 = mappings[colName_column];
      colId3 = mappings[colName_id];*/
      let tableName = mapped[colName_table];
      let id = mapped[colName_id];
      let columnName = mapped[colName_column];
      let tableData = await grist.docApi.fetchTable(tableName);
      let i = tableData.id.indexOf(id);
      let value = tableData[columnName][i];
      //data.status = `value is "${value}"`;
      if (!value) {
        await grist.docApi.applyUserActions([['UpdateRecord', tableName, id, {
          [columnName]: true
        }]]);
      }
      /*await grist.docApi.applyUserActions([['UpdateRecord', tableName, id, {
        [columnName]: true
      }]]);*/
      data.status = `All done.`;
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
      {name: colName_id, title: "ID (of the target record)"}
    ]
  });
});
