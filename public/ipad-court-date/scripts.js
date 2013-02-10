
function moveToScreen(no) {
  var screenCount = document.querySelectorAll('#screen > *').length;

  var state = 'last';
  for (var i = 1; i <= screenCount; i++) {
    if (i == no) {
      var state = 'current';
    } else if (state == 'current') {
      var state = 'next';
    }

    document.querySelector('#screen > [no="' + i + '"]').setAttribute('state', state);
  }
}

function main() {
  moveToScreen(2);

  document.querySelector('#screen > [no="2"] button').addEventListener(
      'click', function() { moveToScreen(3) }, false);
}
