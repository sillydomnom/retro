import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { DropzoneArea } from "material-ui-dropzone";
import LoadIcon from "@material-ui/icons/Publish";
import {
  Fab,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  DialogActions,
  TextField,
  Typography,
  withMobileDialog,
  makeStyles,
} from "@material-ui/core";

import { upload, validateInput } from "../../utils";
import { BOARD_NAME_TOO_LONG_MSG } from "../../constants/errorMessages";

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
    minWidth: "11rem",
  },
  bordNameField: {
    marginBottom: theme.spacing(2),
  },
  icon: {
    marginRight: theme.spacing(1),
  },
}));

function LoadBoardDialog({ fullScreen }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const classes = useStyles();
  let history = useHistory();

  const input = validateInput(title.length, 0, 40);

  function openDialog() {
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setFiles([]);
    setTitle("");
  }

  function renderError() {
    if (input.isTooLong) {
      return (
        <Typography variant="caption" color="error">
          {BOARD_NAME_TOO_LONG_MSG}
        </Typography>
      );
    }

    return null;
  }

  function handleTitleChange(event) {
    setTitle(event.target.value);
  }

  function handleChange(files) {
    setFiles(files);
  }

  async function handleSubmit() {
    const response = await upload(files[0], title);
    if (response.ok) {
      const json = await response.json();
      const boardId = json.boardId;
      history.push({ pathname: `/boards/${boardId}`, state: { isImport: true } });
    } else {
      alert("Something went wrong... :(");
    }
  }

  return (
    <>
      <Fab
        size="large"
        variant="extended"
        color="primary"
        onClick={openDialog}
        className={classes.button}
      >
        <LoadIcon className={classes.icon} />
        Load Board
      </Fab>
      <Dialog
        fullWidth
        maxWidth="xs"
        fullScreen={fullScreen}
        open={open}
        onClose={closeDialog}
        aria-labelledby="load-template-dialog-title"
      >
        <DialogTitle id="load-template-dialog-title">Load Template</DialogTitle>
        <DialogContent>
          <DialogContentText>Please upload your board template</DialogContentText>
          <TextField
            required
            autoFocus
            fullWidth
            className={classes.bordNameField}
            value={title}
            onChange={handleTitleChange}
            error={input.isTooLong}
            helperText={renderError()}
            id="board-name"
            label="Board Name"
            type="text"
            margin="normal"
            autoComplete="off"
          />
          <DropzoneArea
            onChange={(files) => handleChange(files)}
            acceptedFiles={["application/json"]}
            maxFileSize={5000000}
            filesLimit={1}
            showPreviews
            useChipsForPreview
            showPreviewsInDropzone={false}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" disabled={!input.isValid}>
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default withMobileDialog()(LoadBoardDialog);