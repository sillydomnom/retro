import React, { useState, useContext } from "react";
import nanoid from "nanoid";
import AddIcon from "@material-ui/icons/Add";
import {
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  withMobileDialog,
  Typography
} from "@material-ui/core";

import { connectSocket, validateInput, isInputEmpty } from "../../utils";
import { CREATE_CARD } from "../../utils/eventNames";
import { getUser } from "../../utils/roleHandlers";
import { BoardContext } from "../context/BoardContext";
import {
  CARD_AUTHOR_NAME_EMPTY_MSG,
  CARD_AUTHOR_NAME_TOO_LONG_MSG,
  CARD_CONTENT_EMPTY_MSG
} from "../../utils/errorMessages";

function CreateItemDialog(props) {
  // props
  const { columnId, fullScreen } = props;

  // state
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  // context
  const boardId = useContext(BoardContext);

  // validation
  const authorInput = validateInput(author.length, 0, 40);
  const isContentEmpty = isInputEmpty(content.length);

  function handleOpen() {
    const user = getUser(boardId);
    const author = user === null ? "" : user["name"];
    setOpen(true);
    setAuthor(author);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleAuthorChange(event) {
    setAuthor(event.target.value);
  }

  function handleContentChange(event) {
    setContent(event.target.value);
  }

  function resetState() {
    setOpen(false);
    setAuthor("");
    setContent("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const socket = connectSocket(boardId);
    const id = nanoid();
    const newCard = { id, author, content, points: 0 };

    socket.emit(CREATE_CARD, newCard, columnId, boardId);
    resetState();
  }

  function renderAuthorError(isAuthorEmpty, isAuthorLong) {
    if (isAuthorEmpty || isAuthorLong) {
      return (
        <Typography variant="caption" color="error">
          {isAuthorEmpty
            ? CARD_AUTHOR_NAME_EMPTY_MSG
            : CARD_AUTHOR_NAME_TOO_LONG_MSG}
        </Typography>
      );
    }

    return null;
  }

  function renderContentError(isContentEmpty) {
    if (isContentEmpty) {
      return (
        <Typography variant="caption" color="error">
          {isContentEmpty ? CARD_CONTENT_EMPTY_MSG : null}
        </Typography>
      );
    }

    return null;
  }

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        data-testid="new-item-btn"
      >
        <AddIcon fontSize="small" data-testid="new-item-btn-icon" />
      </IconButton>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="new-card-dialog"
      >
        <DialogTitle id="new-card-dialog">New Card</DialogTitle>
        <DialogContent>
          <TextField
            required
            error={!authorInput.isValid}
            margin="dense"
            id="author-name"
            label="Author"
            type="text"
            value={author}
            onChange={handleAuthorChange}
            helperText={renderAuthorError(
              authorInput.isEmpty,
              authorInput.isTooLong
            )}
            fullWidth
            autoComplete="off"
          />
          <TextField
            required
            autoFocus
            error={isContentEmpty}
            margin="dense"
            multiline
            id="content-name"
            label="Content"
            type="text"
            value={content}
            onChange={handleContentChange}
            helperText={renderContentError(isContentEmpty)}
            fullWidth
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            disabled={!authorInput.isValid || isContentEmpty}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default withMobileDialog()(CreateItemDialog);
