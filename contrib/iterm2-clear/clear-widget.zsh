# Clears the screen and scrollback through the shell so inshellisense's screen
# mirror and prompt markers stay in sync. Bind a terminal key to send \e[1099~.
_clear_screen_and_scrollback() {
  local saved_buffer=$BUFFER saved_cursor=$CURSOR
  BUFFER=
  zle clear-screen
  zle -R
  printf '\e[3J' > /dev/tty
  if (( ${+functions[__is_prompt_start]} )); then
    __is_prompt_start
    __is_prompt_end
  fi
  BUFFER=$saved_buffer
  CURSOR=$saved_cursor
}
zle -N _clear_screen_and_scrollback
bindkey '\e[1099~' _clear_screen_and_scrollback
