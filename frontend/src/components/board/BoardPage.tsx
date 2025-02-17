import { Grid, makeStyles } from "@material-ui/core";
import isEqual from "lodash/isEqual";
import React, { useContext, useEffect, useState } from "react";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { Redirect, useLocation, useRouteMatch } from "react-router-dom";
import {
  BOARD_ERROR,
  CONNECT,
  CONTINUE_DISCUSSION_ABSTAIN,
  CONTINUE_DISCUSSION_NO,
  CONTINUE_DISCUSSION_YES,
  FOCUS_CARD,
  JOIN_BOARD,
  JOIN_ERROR,
  REMOVE_FOCUS_CARD,
  RESET_VOTES,
  SEND_REACTION,
  SET_MAX_VOTES,
  SHOW_CONTINUE_DISCUSSION,
  UPDATE_BOARD,
} from "../../constants/event.constants";
import { BoardContext } from "../../context/BoardContext";
import { UserContext } from "../../context/UserContext";
import {
  RetroBoard,
  RetroCard,
  RetroCommentMap,
} from "../../types/common.types";
import { defaultBoard, isSameColumn, isSamePosition } from "../../utils";
import {
  handleColumnDrag,
  handleCombine,
  handleInsideColumnDrag,
  handleNormalDrag,
} from "../../utils/dnd-handler.utils";
import {
  getUser,
  ROLE_MODERATOR,
  ROLE_PARTICIPANT,
} from "../../utils/user.utils";
import { FlexContainer } from "../styled-components";
import BoardHeader from "./BoardHeader";
import Columns from "./columns/Columns";
import CreateItemDialog from "./dialogs/CreateItemDialog";
import DeleteColumnDialog from "./dialogs/DeleteColumnDialog";
import DeleteItemDialog from "./dialogs/DeleteItemDialog";
import Dialogs from "./dialogs/Dialogs";
import EditColumnDialog from "./dialogs/EditColumnDialog";
import EditItemDialog from "./dialogs/EditItemDialog";
import MergeCardsDialog from "./dialogs/MergeCardsDialog";
import RetroItemDetailDialog from "./dialogs/RetroItemDetailDialog";
import ReactionBar from "./footer/ReactionBar";
import AppHeader from "./header/AppHeader";
import VoteProgress from "./VoteProgress";

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
}));

// stores the current result of a combine
let combineResult: DropResult;

export default function BoardPage() {
  const [board, setBoard] = useState(defaultBoard as RetroBoard);
  const [isMergeDialogOpen, setMergeDialog] = useState(false);
  const [merge, setMerge] = useState(false);
  const {
    boardId,
    socket,
    setFocusedCard,
    showReaction,
    removeFocusedCard,
    toggleContinueDiscussion,
    updateComments,
    voteYes,
    voteNo,
    voteAbstain,
  } = useContext(BoardContext);
  const { createModerator, createParticipant, setMaxVote, resetVotes } =
    useContext(UserContext);
  const classes = useStyles();
  const location = useLocation();
  const match = useRouteMatch();

  // set tab name
  useEffect(() => {
    document.title = `Retro | ${board.title}`;

    return () => {
      document.title = "Retro";
    };
  }, [board.title]);

  useEffect(() => {
    // pull state, when navigating back and forth
    if (isEqual(board, defaultBoard) && match.isExact) {
      socket.emit(JOIN_BOARD, boardId);
    }

    socket.on(CONNECT, () => {
      socket.emit(JOIN_BOARD, boardId);
    });

    socket.on(BOARD_ERROR, () => {
      setBoard({ ...board, error: true });
    });

    socket.on(JOIN_BOARD, (boardData: RetroBoard) => {
      const { boardId, maxVoteCount } = boardData;
      if (location.state && getUser(boardId) === null) {
        createModerator(boardId, ROLE_MODERATOR, maxVoteCount);
      } else if (getUser(boardId) === null) {
        createParticipant(boardId, ROLE_PARTICIPANT, maxVoteCount);
      }

      setBoard(boardData);
      updateComments(getCommentMap(boardData));
    });

    socket.on(JOIN_ERROR, () => {
      setBoard({ ...board, error: true });
    });

    socket.on(UPDATE_BOARD, (newBoard: RetroBoard) => {
      setBoard(newBoard);
      updateComments(getCommentMap(newBoard));
    });

    socket.on(SET_MAX_VOTES, (newBoard: RetroBoard) => {
      setMaxVote(boardId, newBoard.maxVoteCount);
      setBoard(newBoard);
    });

    socket.on(RESET_VOTES, (newBoard: RetroBoard) => {
      resetVotes(boardId, newBoard.maxVoteCount);
      setBoard(newBoard);
    });

    socket.on(FOCUS_CARD, (focusedCard: string) => {
      setFocusedCard(focusedCard);
    });

    socket.on(REMOVE_FOCUS_CARD, () => {
      removeFocusedCard();
    });

    socket.on(SHOW_CONTINUE_DISCUSSION, (isToggled: boolean) => {
      toggleContinueDiscussion(isToggled);
    });

    socket.on(CONTINUE_DISCUSSION_YES, () => {
      voteYes();
    });

    socket.on(CONTINUE_DISCUSSION_NO, () => {
      voteNo();
    });

    socket.on(CONTINUE_DISCUSSION_ABSTAIN, () => {
      voteAbstain();
    });

    socket.on(SEND_REACTION, (reactionId: string) => {
      showReaction(reactionId);
    });

    return () => {
      // Pass nothing to remove all listeners on all events.
      socket.removeAllListeners();
    };

    // eslint-disable-next-line
  }, []);

  function getCommentMap(board: RetroBoard) {
    const comments: RetroCommentMap = Object.keys(board.items)
      // Get all Items
      .map((columnId: string) => board.items[columnId])
      //Bring all CommentIds in context to its cardId
      .map((card: RetroCard) => ({ [card.id]: card.commentIds }))
      //Get all RetroComments that match the cardId
      .map((cardCommentsIds: { [x: string]: string[] }) => {
        const cardId = Object.keys(cardCommentsIds)[0];
        return {
          [cardId]: cardCommentsIds[cardId].map(
            (commentId: string) => board.comments[commentId]
          ),
        };
      })
      //Remove unnecessary Array Layer
      .reduce(
        (obj, item) => (
          (obj[Object.keys(item)[0]] = item[Object.keys(item)[0]]), obj
        ),
        {}
      );

    return comments;
  }

  function openMergeDialog() {
    setMergeDialog(true);
  }

  function closeMergeDialog() {
    setMergeDialog(false);
  }

  function startMerge() {
    setMerge(true);
  }

  function stopMerge() {
    setMerge(false);
  }

  if (merge) {
    handleCombine(board, combineResult, stopMerge, setBoard, socket);
  }

  function onDragEnd(dragResult: DropResult) {
    const { source, destination, type, combine } = dragResult;
    const { columns } = board;

    // store current dragResult and ask the user if he wants to merge
    if (combine) {
      combineResult = dragResult;
      openMergeDialog();
      return;
    }

    if (!destination) return;
    if (isSamePosition(source, destination)) return;
    if (type === "column") {
      handleColumnDrag(board, dragResult, setBoard, socket);
      return;
    }

    if (isSameColumn(columns, source, destination)) {
      handleInsideColumnDrag(board, dragResult, setBoard, socket);
      return;
    }

    handleNormalDrag(board, dragResult, setBoard, socket);
  }

  function renderBoard(board: RetroBoard) {
    const { columns, items, columnOrder } = board;
    return columnOrder.map((columnId, index) => {
      const column = columns[columnId];
      return (
        <Columns
          key={column.id}
          column={column}
          itemMap={items}
          index={index}
        />
      );
    });
  }

  if (board.error) {
    return <Redirect to={"/error"} />;
  }

  return (
    <>
      <AppHeader />
      <VoteProgress />
      <Grid container className={classes.root} direction="column">
        <BoardHeader title={board.title} />
        <Grid item xs={12}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="allColumns"
              direction="horizontal"
              type="column"
            >
              {(provided) => (
                <FlexContainer
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {renderBoard(board)}
                  {provided.placeholder}
                </FlexContainer>
              )}
            </Droppable>
          </DragDropContext>
        </Grid>
        {board.isReactionOn && <ReactionBar />}
        <MergeCardsDialog
          open={isMergeDialogOpen}
          closeDialog={closeMergeDialog}
          startMerge={startMerge}
          stopMerge={stopMerge}
        />
        <Dialogs>
          <DeleteItemDialog />
          <DeleteColumnDialog />
          <EditItemDialog />
          <EditColumnDialog />
          <CreateItemDialog />
          <RetroItemDetailDialog />
        </Dialogs>
      </Grid>
    </>
  );
}
