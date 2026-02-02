
/* global Postmonger */
(function () {
  'use strict';

  // Create the Postmonger session (bridge to Journey Builder)
  const connection = new Postmonger.Session();

  // Journey Builder supplies this payload when we call 'ready'
  let activity = {};
  let schema = [];
  let pendingSelectedField = null;  // holds saved token until options exist

  document.addEventListener('DOMContentLoaded', () => {
    // Listen to JB lifecycle events
    connection.on('initActivity', onInitActivity);
    connection.on('requestedTokens', onTokens);
    connection.on('requestedEndpoints', onEndpoints);
    connection.on('requestedSchema', onRequestedSchema); // common pattern in field pickers
    connection.on('clickedNext', onDone);

    // Signal readiness and request useful context
    connection.trigger('ready');
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');

    // Optionally, ask for Entry Source schema (undocumented but widely used in the field)
    connection.trigger('requestSchema');

    // Bind UI
    document.getElementById('done').addEventListener('click', onDone);
  });

  function onInitActivity (payload) {
    activity = payload || {};
    // Re-hydrate UI if the activity is being edited
    try {
      const args = (activity.arguments?.execute?.inArguments || [])[0] || {};
      // alert(args.apiUrl);
      // alert(args.selectedField);
      if (args.apiUrl) document.getElementById('apiUrl').value = args.apiUrl;
      if (args.selectedField) document.getElementById('fieldPicker').value = args.selectedField;
      pendingSelectedField = args.selectedField;
      // alert(pendingSelectedField);
    } catch (e) {}
  }

  function onTokens (tokens) {
    // If you ever need REST/SOAP tokens, they arrive here
    // console.log('JB tokens:', tokens);
  }

  function onEndpoints (endpoints) {
    // REST base URL for BU, if you need it
    // console.log('JB endpoints:', endpoints);
  }

  function onRequestedSchema (payload) {
    schema = payload?.schema || [];
    const select = document.getElementById('fieldPicker');

    // Keep current value if re-opening
    const current = select.value;
    // Reset options (leave the first '— none —')
    select.length = 1;

    // Populate with Entry Source keys (e.g., {{Event.APIEvent-UUID.Email}})
    schema.forEach(col => {
      const opt = document.createElement('option');
      opt.value = `{{${col.key}}}`;
      // alert(opt.value);
      opt.textContent = col.key.split('.').pop();
      // alert(opt.textContent);
      select.appendChild(opt);
    });

    if (current) select.value = current;
    // alert(pendingSelectedField);
    if (pendingSelectedField) select.value = pendingSelectedField;
    // alert(select.value);
    
  }

  function onDone () {
    const apiUrl = document.getElementById('apiUrl').value?.trim() || '';
    const selectedField = document.getElementById('fieldPicker').value || '';

    // Validate minimal config
    if (!apiUrl) {
      alert('Please provide a MuleSoft API URL.');
      return;
    }
    alert(selectedField);

    // Build inArguments that JB will POST to /execute at run time
    const inArguments = [{
      apiUrl,            // static value from UI
      selectedField      // optional mustache ref to Journey Data
    }];

    // Mutate the activity payload we received and hand back to JB
    activity.arguments = activity.arguments || {};
    activity.arguments.execute = activity.arguments.execute || {};
    activity.arguments.execute.inArguments = inArguments;

    alert('1');
    activity.metaData = activity.metaData || {};
    activity.metaData.isConfigured = true;

    alert('2');
    alert(activity.metaData);
    alert('3');
    // console.log('payload saving:', JSON.stringify(activity, null, 2));

    // Tell Journey Builder to save this configuration
    connection.trigger('updateActivity', activity);
  }
})();
