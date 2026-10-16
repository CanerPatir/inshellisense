# Cmd+K clear for iTerm2 + zsh

iTerm2's built-in **Clear Buffer** (Cmd+K) wipes the screen inside the terminal
app without the shell knowing. inshellisense keeps a mirror of the screen and
tracks the command line through prompt markers, so after a native clear it
repaints stale output and stops showing suggestions.

The fix routes Cmd+K through the shell instead: iTerm2 sends a private escape
sequence, and a zsh widget clears the screen and scrollback, then re-emits the
inshellisense prompt markers at the new prompt position. Text already typed on
the line is kept.

## Setup

1. Source the widget from `~/.zshrc`, before the `is init zsh` line:

   ```zsh
   source /path/to/inshellisense/contrib/iterm2-clear/clear-widget.zsh
   ```

2. Bind Cmd+K in iTerm2: **Settings → Keys → Key Bindings → +**, press Cmd+K,
   choose **Send Escape Sequence** and enter `[1099~`. From the command line
   (restart iTerm2 afterwards):

   ```bash
   defaults write com.googlecode.iterm2 GlobalKeyMap '<dict><key>0x6b-0x100000-0x28</key><dict><key>Action</key><integer>10</integer><key>Text</key><string>[1099~</string><key>Version</key><integer>1</integer><key>Apply Mode</key><integer>0</integer><key>Escaping</key><integer>2</integer></dict></dict>'
   ```

   iTerm2 3.7 expects the three-part key (`char-modifiers-keycode`); the
   two-part form is ignored silently. The command replaces any existing global
   key bindings.

3. Move the **Clear Buffer** menu shortcut off Cmd+K, otherwise the menu wins:

   ```bash
   defaults write com.googlecode.iterm2 NSUserKeyEquivalents -dict-add "Clear Buffer" "@~^k"
   ```

4. Make sure the iTerm2 **Leader** key (Settings → Keys → Key Bindings, bottom)
   is not Cmd+K; a leader on the same key swallows the binding.

## Enter as the accept key

This fork lets Enter accept suggestions without breaking command execution.
Enable it in `~/.inshellisenserc`:

```toml
[bindings.acceptSuggestion]
key = "return"
```

Enter accepts only after you typed into the current token or picked a
suggestion with the arrow keys; the Enter right after an accept runs the
command.
