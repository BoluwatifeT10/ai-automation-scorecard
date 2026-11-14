"use client";

import { useState } from "react";
import { useAssessment } from "@/context/assessment-context";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui";

export function ResetDataButton() {
  const { reset } = useAssessment();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
      >
        Reset saved data
      </Button>
      {done ? <p className="text-sm text-success">Saved assessment data was removed from this browser.</p> : null}
      <ConfirmDialog
        open={open}
        title="Clear this assessment?"
        body="This removes the saved draft and report from this browser."
        confirmLabel="Reset"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          reset();
          setOpen(false);
          setDone(true);
        }}
      />
    </>
  );
}
