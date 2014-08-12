function bindForm($form){
  var $str = $form.find('[data-attr=str]'),
      $seed = $form.find('[data-attr=seed]'),
      $result = $form.find('[data-result=value]'),
      $percent = $form.find('[data-result=percent]'),
      submitForm = function(){ $form.triggerHandler('submit'); return false; };

  $form.on('click', 'a.submit', submitForm);
  $form.on('change', 'select', submitForm);

  $str.add($seed).on('keyup change', submitForm);

  $form.on('submit', function(){
    var $this = $(this),
        method = window[$(this).attr('data-method')],
        result = null, i = null, percent = null;

    // Expand method ref for methods like murmurHash3.x64.hash128
    for(i = 1; $this.find('[name="meth' + i + '"]')[0]; i++){
      method = method[$this.find('[name="meth' + i + '"]').val()];
    }

    // Calculate the hash result
    if(method){
      result = method( $str.val(), parseInt($seed.val(),10) );

      // Output the result
      $result.val(result);

      // Calculate the percent and fall back to 128bit version if necessary
      percent = (Math.round((result / 4294967295) * 10000) / 100);
      if( isNaN(percent) ){
        percent = Math.round((parseInt(result,16) / parseInt('ffffffffffffffffffffffffffffffff',16)) * 10000) / 100
      }
      $percent.val(percent + '%');
    } else {
      $result.val('Method not implemented');
      $percent.val('');
    }

    // Stop event propagation
    return false;
  })
};

function bindNginxForm($form){
  var submitForm = function(){ $form.triggerHandler('submit'); return false; };
  $form.find('.config, [data-attr=str]').on('keyup change', submitForm);

  $form.on('submit', function(){
    var inputArr = $form.find('[data-attr=str]').val().split("\n"),
        $result = $form.find('[data-result=value]'),
        configLines = $form.find('.config').val().split("\n"), line = null,
        configArr = [], memo = 0, i = 0, md = null;

    // Parse the config into configArr
    while(line = configLines.shift()){
      if(md = line.match(/^(\s+)?([\.\d]+)%\s+(.+?);?$/)){
        memo = memo + parseFloat(md[2]) * 4294967295 / 100;
        configArr.push([memo, md[3]]);
      } else if(md = line.match(/^(\s+)?(\*)\s+(.+?);?$/)) {
        configArr.push([0, md[3]]);
      }
    }

    // Go through the input string
    $result.val('');
    while(line = inputArr.shift()){
      for(i=0; i<configArr.length; i++){
        if(murmurhash2_32_gc(line,0) < configArr[i][0] || configArr[i][0] == 0){
          $result.val( $result.val() + configArr[i][1] + " # " + line + "\n");
          break;
        }
      }
    }

    // Stop propagation
    return false;
  });
}

$( function(){
  bindForm($('form#murmurhash2-form'));
  bindForm($('form#murmurhash3-form'));
  bindNginxForm($('form#nginx-split-clients-form'));
});
