import React from "react";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import { compose } from "recompose";
import { withRouter } from "react-router-dom";
import {
  Button,
  Fab,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  withMobileDialog,
  withStyles,
  Typography
} from "@material-ui/core";

import { isBoardIdValid } from "../../utils";
import { LOAD_BOARD_ID_INVALID_MSG } from "../../utils/errorMessages";

class LoadBoardDialog extends React.Component {
  state = { open: false, boardId: "", error: false };

  handleOpen = () => this.setState({ open: true });

  handleClose = () => this.clearState();

  handleChange = e => this.setState({ boardId: e.target.value });

  handleSubmit = async history => {
    const { boardId } = this.state;
    const isValid = await isBoardIdValid(boardId);

    if (isValid) {
      history.push(`/boards/${boardId}`);
      this.clearState();
    } else {
      this.setState({ error: true });
    }
  };

  clearState() {
    this.setState({ open: false, boardId: "", error: false });
  }

  renderError() {
    if (this.state.error) {
      return (
        <Typography color="error" variant="caption">
          {LOAD_BOARD_ID_INVALID_MSG}
        </Typography>
      );
    }

    return null;
  }

  render() {
    const { open, boardId } = this.state;
    const { classes, fullScreen, history } = this.props;

    return (
      <>
        <Fab
          size="medium"
          variant="extended"
          color="primary"
          onClick={this.handleOpen}
          className={classes.button}
        >
          <ArrowUpwardIcon className={classes.icon} />
          Load Board
        </Fab>
        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="load-board-dialog-title"
        >
          <DialogTitle id="load-board-dialog-title">Load Board</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please provide the Board-ID of your board.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Board-ID"
              type="text"
              value={boardId}
              onChange={this.handleChange}
              helperText={this.renderError()}
              fullWidth
              autoComplete="off"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={() => this.handleSubmit(history)} color="primary">
              Load
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
  },
  icon: {
    marginRight: theme.spacing.unit,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  }
});

export default compose(
  withRouter,
  withMobileDialog(),
  withStyles(styles)
)(LoadBoardDialog);
