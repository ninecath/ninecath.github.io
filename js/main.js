import { r, g, c, n } from "./xeact.js";

/*
 * Mouse events Initialize
  * @method 
 */

let button_down = 0;

/* 
 * Initialize localStorage
 * */

var block,
    output,
    selected_items = [],
    coloursNames = {
      'black' : '', 'blackBright' : '', 'red'  : '', 'redBright'  : '', 'green' : '', 'greenBright' : '',
      'yellow': '', 'yellowBright': '', 'blue' : '', 'blueBright' : '', 'purple': '', 'purpleBright': '',
      'cyan'  : '', 'cyanBright'  : '', 'white': '', 'whiteBright': ''
    }


/*
 * Start everything
 **/


r( async () => { // IIFE to avoid globals



  /*
   * NOTE: This serve to create new blocks where you can edit arts.
   */
  class Block {

    constructor (rows = '1', columns = '1') {

      this._columns    = Number.parseInt(columns)
      this._rows       = Number.parseInt(rows)
      this._parent     = c('block')[0]
      this._container  = this.create(false)
      this._names      = [ 'blockHeight', 'blockWidth' ]

    }

    create (remove = false) {

      // New block to input new art.
      if (remove) {

        // Update values of localStorage
        this._names.forEach( name => localStorage[name] = n(name)[0].value )

        this._rows    = Number.parseInt( localStorage[this._names[1]] )
        this._columns = Number.parseInt( localStorage[this._names[0]] )

        this.remove();

        this._parent.insertAdjacentHTML( 'beforeend', this.elementHTML('block') )

        this._container = g('block')

      } else {

        this._parent.insertAdjacentHTML( 'beforeend', this.elementHTML('block') )

        return g('block')

      }

    }

    columns () { return this._columns }

    rows    () { return this._rows    }

    remove () { this._container.remove() }

    elementHTML (type = '', column = 0, row = 0) { 

      switch (type) {

        case 'row':
          return `<input type="text" maxlength="1" data-column="${column}" data-row="${row}" value=" " class="column-item">`

        case 'column':
          return `<div data-column="${column}" class="column"></div>`

        case 'block':
          return `<!-- Our big block -->\n<div id="block"></div>`

      }

    }

    move (direction = '', column = 0, row = 0, is_shifted = false) {

      let oldColumn = column,
          oldRow    = row

      const is_infinite = localStorage['infiniteMoving'] === 'true'

      switch (direction) {

        case 'up':
          if      (row-- ===  0 && is_infinite) row = this._rows - 1;
          else if (row   === -1)                row = 0;
          break;

        case 'down':
          if      (row++ === this._rows - 1 && is_infinite) row = 0;
          else if (row   === this._rows)                    row = this._rows - 1;
          break;

        case 'right':
          if      (column++ === this._columns - 1 && is_infinite) column = 0;
          else if (column   === this._columns)                    column = this._columns - 1;
          break;

        case 'left':
          if      (column-- ===  0 && is_infinite) column = this._columns - 1;
          else if (column   === -1)                column = 0;
          break;

        case 'next':
          if (column++ === this._columns - 1 && is_infinite) {
            column = 0
            row++
          }
          else if (column === this._columns) column = this._columns - 1;
          if      (row    === this._rows)    row    = 0;

      }

      if (is_shifted) {

        this.item( oldColumn, oldRow ).classList.add('selected')
        selected_items.push( [oldColumn, oldRow] )

        this.item( column, row).classList.add('selected');
        selected_items.push( [column, row] )

      }
      else removeSelected(this._container);

      this.item( column, row ).focus()

    }

    // Apply effect (bold, italic, underline) to an element.
    effect (column, row, types = [''], effects = ['']) {

      const item = this.item(column, row)

      for ( let i = 0; i < types.length; i++ ) {

        // Apply such effect.
        if (effects[i] === 'true') {

          item.setAttribute( `data-${types[i]}`, true );
          localStorage[`item-${types[i]}-${column}-${row}`] = true

        // Do not apply the effect/remove it.
        } else {

          item.removeAttribute( `data-${types[i]}` )
          localStorage[`item-${types[i]}-${column}-${row}`] = ''

        }

      }

    }

    // Apply BG/FG colour to the item.
    colour (column = 0, row = 0, types = [''], colours = [''] ) {

      const item = this.item(column, row)

      // So that repeating is not excessive...
      const add = (element, typeItem = '', colour = '') => {

        if (colour) {

          // Reset the colours set by # to normal one.
          if   (typeItem === 'bg') item.style.backgroundColor = '';
          else                     item.style.color = '';

          // If the colour is hash and not built-in from theme.
          if (colour[0] === '#') {
            if   (typeItem === 'bg') item.style.backgroundColor = colour;
            else                     item.style.color = colour;
          }

          element.setAttribute(`data-${typeItem}`, colour);

        // Remove colour if there wasn't any selected.
        } else {
          if   (typeItem === 'bg') item.style.backgroundColor = '';
          else                     item.style.color = '';
          element.removeAttribute(`data-${typeItem}`);
        }

        localStorage[`item-${typeItem}-${column}-${row}`] = colour

      }

      for (let i = 0; i < types.length; i++) {

        if ( !types[i] ) {

          if (localStorage['isBackground'] === 'true') add(item, 'bg', colours[i]);
          else                                         add(item, 'fg', colours[i]);

        } else add(item, types[i], colours[i]);

      }

    }

    focus (column = 0, row = 0, text, type = undefined, colour = localStorage['data-colour'] ) {

      // Apply the colour for the item and text.
      const applyItemColour = (columnItem = 0, rowItem = 0) => {

        const item = this.item(columnItem, rowItem)

        // Apply text.
        if (text !== undefined) {
          item.value = text
          localStorage[`item-${columnItem}-${rowItem}`] = text
        }

        // Get item from document.
        if (text !== 'Delete') {

          block.colour(columnItem, rowItem, [type], [colour])

          if (item.value !== ' ') {
            block.effect( columnItem, rowItem, ['underline', 'italic', 'bold'], [localStorage['isBold'], localStorage['isItalic'], localStorage['isUnderline']] )
          } else {
            block.colour( columnItem, rowItem, ['fg'], [''])
            block.effect( columnItem, rowItem, ['underline', 'italic', 'bold'], ['', '', ''] )
          }
        } else {
          block.colour( columnItem, rowItem, ['fg', 'bg'], ['', ''] )
          block.effect( columnItem, rowItem, ['underline', 'italic', 'bold'], ['', '', ''] )
          item.value = ' '
          localStorage[`item-${columnItem}-${rowItem}`] = ' '
          return
        }

      }

      // Loop throughout the selected items to apply the colour.
      if (c('selected').length > 0)
        for (const itemInf of selected_items)
          applyItemColour(itemInf[0], itemInf[1], text);
      // If just one, just apply one (the current within input).
      else
        applyItemColour(column, row);

      // Pass the new text to the output block.
      output.update()

    }


    item (column = 0, row = 0) {

      return this._container.children[column].children[row]

    }

    render (focus = false) {

      const runText = (column, row, letter) => {
        // If it's only one letter
        if (letter.length === 1) {
          this.focus(column, row, letter)
          if (localStorage['moveAfterInput'] === 'true') this.move('next', column, row);
        }
      }

      for (let i = 0; i < this._columns; i++) {

        // Add column and select.
        this._container.insertAdjacentHTML( 'beforeend', this.elementHTML('column', i) )
        const column = c('column')[i]

        if (column) {

          for (let j = 0; j < this._rows; j++) {

            // Add item in column and select.
            column.insertAdjacentHTML( 'beforeend', this.elementHTML('row', i, j) )
            const item = c('column')[i].children[j]

            // Set old value from localStorage for this item.
            if (localStorage[`item-${i}-${j}`])           item.value = localStorage[`item-${i}-${j}`];
            if (localStorage[`item-fg-${i}-${j}`])        block.colour(i, j, ['fg'], [localStorage[`item-fg-${i}-${j}`]]);
            if (localStorage[`item-bg-${i}-${j}`])        block.colour(i, j, ['bg'], [localStorage[`item-bg-${i}-${j}`]]);
            if (localStorage[`item-bold-${i}-${j}`])      block.effect(i, j, ['bold'], [localStorage[`item-bold-${i}-${j}`]]);
            if (localStorage[`item-underline-${i}-${j}`]) block.effect(i, j, ['underline'], [localStorage[`item-underline-${i}-${j}`]]);
            if (localStorage[`item-italic-${i}-${j}`])    block.effect(i, j, ['italic'], [localStorage[`item-italic-${i}-${j}`]]);

            // Events for items
            item.addEventListener('keydown', e => {

              switch (e.code) {
                // Apply pallete colours.
                case 'Digit1':
                  if   (!e.shiftKey) selectColour('black', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                case 'Digit2':
                  if   (!e.shiftKey) selectColour('red', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                case 'Digit3':
                  if   (!e.shiftKey) selectColour('green', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                case 'Digit4':
                  if   (!e.shiftKey) selectColour('yellow', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                case 'Digit5':
                  if   (!e.shiftKey) selectColour('blue', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                case 'Digit6':
                  if   (!e.shiftKey) selectColour('purple', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                case 'Digit7':
                  if  (!e.shiftKey) selectColour('cyan', e.ctrlKey)
                  else              runText(i, j, e.key)
                  break;
                case 'Digit8':
                  if   (!e.shiftKey) selectColour('white', e.ctrlKey)
                  else               runText(i, j, e.key)
                  break;
                // Main keys.
                case 'ArrowUp':
                  this.move('up', i, j, e.shiftKey)
                  break;
                case 'ArrowDown':
                  this.move('down', i, j, e.shiftKey)
                  break;
                case 'ArrowRight':
                  this.move('right', i, j, e.shiftKey)
                  break;
                case 'ArrowLeft':
                  this.move('left', i, j, e.shiftKey)
                  break;
                case 'Backspace':
                case 'Space':
                  this.focus(i, j, ' ', 'fg', '')
                  break;
                // Update colours.
                case 'Enter':
                  this.focus(i, j, undefined)
                  break;
                // Delete all the information about the item.
                case 'Delete':
                  this.focus(i, j, e.code)
                  break;
                default:
                  runText(i, j, e.key)
              }

            });

            item.addEventListener('mouseup', () => button_down = 0)
            item.addEventListener('mousedown', e => {

              e.preventDefault()
              button_down = 1
              e.target.focus()
              if (!e.shiftKey) removeSelected(this._container);
              localStorage['firstColumn'] = i
              localStorage['firstRow']    = j

            });

            // TODO: Middle click to toggle colour.

            item.addEventListener('mouseenter', e => {

              if (button_down)
                selectFocus( this._container,
                  localStorage['firstColumn'],
                  localStorage['firstRow'],
                  localStorage['secondColumn'] = e.target.getAttribute('data-column'),
                  localStorage['secondRow']    = e.target.getAttribute('data-row'),
                  e.shiftKey);

            });

          }

        }

      }

      if (focus) g('block').children[0].children[0].focus();

    }

  }

  class Output {

    constructor () {

      this._output = g('output')

    }

    // Just add the event listener to it so we can send the decode function when its state changes.
    init () {

      this._output.addEventListener( 'keyup', () => this.decode() )

    }

    // Take from ouput to set into the input everytime the output changes.
    // e.j: a character changes.
    decode () {

      let characters = []

      const shell_code = /\\033\[([\d]+;)*[\d]+m/;
      let   text = this._output.value
      let  match;

      // If the first line contains a comment.
      if (text[0] === '#') text = text.substring(text.indexOf("\n") + 1);

      // Loop to get our characters from output into the array characters.
      for (let i = 0; i < text.length; i++) {

        // Safest way I imagined to verify if it is a shell code colour
        match = shell_code.exec(text);

        // Only push when it matches the index so that we don't add it before it should be added.
        if (match && match.index === i) {

          // Push our shell code.
          characters.push(match[0])
          // Push our character after the shell code.
          if (text[i] !== "\\") characters.push(text[i])
          // Replace the character for dead character so that we can keep looping it.
          text = text.replace(shell_code, 'a')

        } else {

          // Push our character to the text.
          characters.push(text[i])

        }

      }

      // Make it an array so we can loop it later.
      const text_array = g('output').value.replace(new RegExp(/(\\033\[([\d]+;)*[\d]+m)|(^#.+\n)/, 'g'), '').split('\n')

      // Set the block rows and columns.
      // +1 at the end to make the block wider and larger by 1.
      {
        n('blockWidth') [0].value = ( text.match(/\n/g) || '' ).length + 1
        n('blockHeight')[0].value = Math.max(...(text_array.map(el => el.length)))
//        block.create(true)
//        block.render()
//        console.log( block.columns(), block.rows() )
      }

      // Loop through the characters list to set out to the output.
      let i = 0, j = 0; // i = column; j = row
      for (let character of characters) {

        // If there's a break line, let's jump to the next row.
        if (character === "\n") {

          i = 0
          j++
          continue

        }

        console.log(`column: ${i++} - row: ${j} ${character}`)


      }
      // console.log(characters)

    }

    update () {

      // Reset the output to nothing.
      this._output.value = ''

      // Transform the style effects to SHELL code..
      /// @type{function(string boolean, string boolean, string boolean): string} */
      const addStyles = (italic = '', bold = '', underline = '' ) => {

        let valueStyles = ''

        // For bold.
        if (bold === 'true') {
          if (localStorage['output-last-bold'] !== 'true') valueStyles += '\\033[1m';
              localStorage['output-last-bold'] = 'true'
        } else {
          if (localStorage['output-last-bold'] !== '') valueStyles += '\\033[22m';
              localStorage['output-last-bold'] = ''
        }

        // For italic.
        if (italic === 'true') {
          if (localStorage['output-last-italic'] !== 'true') valueStyles += '\\033[3m';
              localStorage['output-last-italic'] = 'true'
        } else {
          if (localStorage['output-last-italic'] !== '') valueStyles += '\\033[23m';
              localStorage['output-last-italic'] = ''
        }


        // For underline.
        if (underline === 'true') {
          if (localStorage['output-last-underline'] !== 'true') valueStyles += '\\033[4m';
              localStorage['output-last-underline'] = 'true'
        } else {
          if (localStorage['output-last-underline'] !== '') valueStyles += '\\033[24m';
              localStorage['output-last-underline'] = ''
        }

        return valueStyles;

      }

      // Transform colour to SHELL code..
      /// @type{function(Element, string): string} */
      const toShellRGB = (item, type = '') => {

        let colour = item.getAttribute(`data-${type}`)

        // Set a comparable string so we can verify later if there isn't any at all.
        if (colour === null) colour = `clear-${type}`;

        // || Verify if this colour is the same as the last one used so that it doesn't repeat 2 > times.
        if (colour === localStorage[`output-last-${type}-colour`]) return '';

        // Save to verify later if it is the same colour being used.
        localStorage[`output-last-${type}-colour`] = colour

        // The type of colour for the shell to apply to.
        // 38 : foreground.
        // 48 : background.
        let codeRGBType = 38
        if (type === 'bg') codeRGBType += 10;

        // If there isn't anything to update...
        if (colour === `clear-${type}`) return `\\033[${codeRGBType + 1}m`

        // If the colour is HEX
        if (colour[0] === '#') {

          // Transform the colour to RGB from HEX.
          colour = (() => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colour);
            return result ? [
              parseInt(result[1], 16),
              parseInt(result[2], 16),
              parseInt(result[3], 16)
            ] : null;
          })();

          // Return the complete value of that character + RGB colours.
          return `\\033[${codeRGBType};2;${colour[0]};${colour[1]};${colour[2]}m`
        }

        // If it is one of the 4-bit (8-16 default SHELL colours).
        else {

          let codeColour = parseInt( g(colour).getAttribute('data-pallete') )

          if (type === 'bg') codeColour += 10;

          return `\\033[${codeColour}m`
        }

      }

      // Loop throughout all children.
      for (let i = 0; i < block.rows(); i++) {

        for (let j = 0; j < block.columns(); j++) {

          let item = g('block').children[j]

          if (item) {

            item = item.children[i]

            if (item) {

              // Initialize text variable.
              let itemValue = ''

              itemValue += toShellRGB( item, 'fg' )
              itemValue += toShellRGB( item, 'bg' )
              itemValue += addStyles( item.getAttribute('data-bold'), item.getAttribute('data-italic'), item.getAttribute('data-underline') )

              // Text from the item.
              this._output.value += itemValue + item.value;

              // Add line break at the end of the row
              if (j === localStorage['blockHeight'] - 1) this._output.value += '\r\n'

            }

          }

        }

      }

      // Remove trailed spaces of the left to center the art.
      let leftSpace = this._output.value.replace(new RegExp('(?!^ +)\\S.*', 'gm'), '').split('\n')
      leftSpace.pop() // Remove useless extra line...
      leftSpace = Math.min(...(leftSpace.map(el => el.length)))
      this._output.value = this._output.value.replace(new RegExp(`^ {${leftSpace}}`, 'gm'), '')

      // Remove trailed spaces of the right.
      this._output.value = this._output.value.replace(new RegExp(' +$', 'gm'), '');

      // Remove first empty lines and last empty lines.
      this._output.value = this._output.value.replace(new RegExp('^\n*|\n+$', 'g'), '')

      // Add credits if there is any without trailed spaces of the right.
      const commentArt = n('commentArt')[0].value.replace(new RegExp(' +$', 'gm'), '')
      if (commentArt) this._output.value = '# ' + commentArt.replace(new RegExp('^ +'), '') + '\n' + this._output.value

    }

  }

  // Remove previous elements that were selected
  const removeSelected = block => {

    for (const item of selected_items)
      block.children[item[0]].children[item[1]].classList.remove('selected');

    selected_items = []

    }

  const parseSelection = () => {

    // Just to make sure it's a valid integer. JS is weird.
    let [firstColumn, secondColumn, firstRow, secondRow] = 
    [parseInt(localStorage['firstColumn']), parseInt(localStorage['secondColumn']), parseInt(localStorage['firstRow']), parseInt(localStorage['secondRow'])]
    
    // If just one element, reset the selection to none.
    if (firstColumn === secondColumn && firstRow === secondRow) return;

    // Switch to normal range {0,?} instead of {?, ?}
    if (firstColumn >= secondColumn) {

      const greaterColumn = firstColumn;
      firstColumn = secondColumn;
      secondColumn = greaterColumn;

    }
    if (firstRow >= secondRow) {

      const greaterRow = firstRow;
      firstRow = secondRow;
      secondRow = greaterRow;

    }

    return [firstColumn, secondColumn, firstRow, secondRow]
    
  }
  


  // Focus a number of selected elements.
  const selectFocus = (block, firstColumn = 0, firstRow = 0, secondColumn = 0, secondRow = 0, isShifted = false) => {

    if (!isShifted) removeSelected(block);

    [firstColumn, secondColumn, firstRow, secondRow] = parseSelection()

    // Add focus to new selected elements
    //console.log(`After: From ${firstColumn} to ${secondColumn}.\nAfter: From ${firstRow} to ${secondRow}.`)
    for (let i = firstColumn; i <= secondColumn; i++) {

      for (let j = firstRow; j <= secondRow; j++) {

        block.children[i].children[j].classList.add('selected')
        selected_items.push([i, j])

      }

    }

  }

  // Apply a colour of a pallete.
  const selectColour = (elementName, isCtrl = false, isElement = false, definiteChoice = false) => {

    let element;

    const cleanOthers = () => {
      for (const selected of c('selectedColour')) selected.classList.remove('selectedColour');
      localStorage['data-colour'] = ''
    }

    if (elementName === undefined) return cleanOthers();

    if (!isElement) {
      // Pick bright colour from pallete if CTRL is enabled.
      if (isCtrl) elementName += 'Bright';
      element = g(elementName)
    } else element = elementName;

    if (element.classList.contains('selectedColour') && !definiteChoice) cleanOthers();
    else {

      cleanOthers()

      element.classList.add('selectedColour')
      // If the element is RGB
      if (element.value)
        localStorage['data-colour'] = element.value
      else
        localStorage['data-colour'] = element.getAttribute('data-colour');

    }

    // If there are current selected elements, then apply the new colour to it.
    if (c('selected').length > 0) block.focus(0, 0, undefined);

  }

  // Load config.json.
  fetch('./data/config.json')
  .then(response => response.json())
  .then(json => {

    // Update the styles of items, like font-size and width.
    const updateItemStyle = (items = [], remove = false) => {

      const styleSheet = document.styleSheets[0]

      if (remove) {
        // 3 for the next 3 styles that are added...
        styleSheet.deleteRule(0);
        styleSheet.deleteRule(0);
        styleSheet.deleteRule(0);
      }

      items.forEach( item => localStorage[item] = n(item)[0].value)

      styleSheet.insertRule(`
        #block .column-item {

          font-size: ${localStorage['fontSize']}px;
          width: ${localStorage['itemWidth']}rem; height: ${localStorage['itemHeight']}rem;

        }
      `, 0);

      styleSheet.insertRule(`
        #output {

          font-size: ${localStorage['fontSize']}px;

        }
      `, 0);

      styleSheet.insertRule(`
        #block::after {

          backdrop-filter: blur(${localStorage['blockBlur']}px);
          opacity: ${localStorage['blockOpacity']};

        }
      `, 0);

    }

    // Apply the first (or last used) theme to the whole page.
    const updateTheme = (theme, themeName = localStorage['lastTheme'], remove = false) => {

      // If none was saved locally before. CHROME engine needs the check in.
      if (themeName && themeName !== 'undefined') theme = theme[themeName];
      else {
        theme     = theme['arcoiris']; // Default theme name.
        themeName = 'arcoiris'
      }

      // Update values on screen and remotelly.
      localStorage['lastTheme'] = themeName
      n('themesList')[0].value  = themeName
      
      // Remove the previous rule CSS for the previous theme.
      if (remove) document.styleSheets[2].deleteRule(0);
      else {

        // Append <style> element to <head>
        document.head.appendChild(document.createElement('style'));

      }

      // Add colours RGB parameters to pallete picker.
      Object.keys(coloursNames).forEach( item => {
        g(item).setAttribute( 'data-colour', item)
        coloursNames[item] = theme[item]
      });

      document.styleSheets[2].insertRule(`

        :root {

          --black:  ${theme.black};  --black-bright:  ${theme.blackBright};
          --red:    ${theme.red};    --red-bright:    ${theme.redBright};
          --green:  ${theme.green};  --green-bright:  ${theme.greenBright};
          --yellow: ${theme.yellow}; --yellow-bright: ${theme.yellowBright};
          --blue:   ${theme.blue};   --blue-bright:   ${theme.blueBright};
          --purple: ${theme.purple}; --purple-bright: ${theme.purpleBright};
          --cyan:   ${theme.cyan};   --cyan-bright:   ${theme.cyanBright};
          --white:  ${theme.white};  --white-bright:  ${theme.whiteBright};

          --background-path: url('../data/themes/${theme.Image.Path}');
          --font-name:       ${theme.FontName};

          --background: ${theme.background}; --foreground: ${theme.foreground};

        }

      `, 0);

    }

    // Random title name
    window.document.title = `ascii-creator ${json['titleIcons'][json['titleIcons'].length * Math.random() | 0]}`;

    // config.json
    const storageKeys = Object.keys(json)
    for (const item of storageKeys) {

      if (item === 'titleIcons') break;

      if (!localStorage[item]) localStorage[item] = json[item]
      n(item)[0].value = localStorage[item]
      if (localStorage[item] === 'true')
        n(item)[0].checked = true;

    }

    // Update automatically when check/uncheck.
    [ 'infiniteMoving', 'moveAfterInput', 'isBackground', 'isBold', 'isUnderline', 'isItalic' ].forEach( item => {
      n(item)[0].addEventListener( 'change', e => {
        localStorage[item] = e.target.checked
      })
    });

    // Update when ENTER is pressed.
    const formatKeys = [ 'blockHeight', 'blockWidth' ]
    formatKeys.forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {
        if (e.key === 'Enter') {

          block.create(true)
          block.render()

        }
      })
    });

    // Update when ENTER is pressed.
    const styleKeys = [ 'fontSize', 'itemWidth', 'itemHeight', 'blockOpacity', 'blockBlur' ]
    styleKeys.forEach( item => {
      n(item)[0].addEventListener( 'keydown', e => {
        if (e.key === 'Enter') updateItemStyle(styleKeys, true);
      })
    });

    // Update when the name of the art changes.
    const delay = ms => new Promise(res => setTimeout(res, ms));
    [ 'nameArt' ].forEach( item => {
      n(item)[0].addEventListener( 'keydown', async e => {
        if (e.key === 'c' && e.ctrlKey) {

          // Get numbers and input from artName
          // RegExp removes the shell codes
          let text = g('output').value.replace(new RegExp(/\\033\[([\d]+;)*[\d]+m/, 'g'), '').split('\n')
          if (text[0][0] === "#") text.shift(); // If there is the comment/credits at the first line, remove it.
          text = (
              e.target.value.replace(new RegExp(' +$', 'gm'), '')
            + ' ' + text.length // Rows of the ASCII art
            + ' ' + Math.max(...(text.map(el => el.length))) ); // Max columns of the ASCII art

          // Write to clipboard
          navigator.clipboard.writeText(text)

          // Notification
          const container = g('information')
          container.insertAdjacentHTML( 'beforeend', `
            <div class="notification">
              Added <span class="copied">${text}</span> to the clipboard
            </div>
          ` )
          const notification = c('notification')[c('notification').length - 1]
          await delay(1000)
          notification.classList.add('leave')
          await delay(1000)
          notification.remove()

        }
      })

    });

    // Update when the credits changes to the output.
    [ 'commentArt' ].forEach( item => {
      n(item)[0].addEventListener( 'keyup', () => output.update() )
    });

    // Add all themes for the selection.
    Object.keys(json.themes).forEach( item => {
      n('themesList')[0].insertAdjacentHTML( 'beforeend', `<option value="${item}">${item}</option>` )
    });
    n('themesList')[0].addEventListener( 'change', e =>  updateTheme(json.themes, e.target.value, true) );


    // Add events for colours to pick.
    for (const item of c('colour')) {
      item.addEventListener( 'change', () => selectColour(item, undefined, true, true) );
      item.addEventListener( 'click', () => selectColour(item, undefined, true, true) );
      item.addEventListener( 'contextmenu', e => {
        e.preventDefault()
        selectColour(item, undefined, true)
      });
    }

    // Apply theme to the page.
    updateTheme(json.themes);

    // Update style of the items.
    updateItemStyle(styleKeys)

    // Clean the selected colour that we had.
    selectColour(undefined)

    // Our container for the blocks and columns.
    block = new Block(localStorage['blockWidth'], localStorage['blockHeight'])
    block.render(true)

    output = new Output()
    output.init()
    output.update()

  })

})
