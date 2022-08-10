import { Task } from "../../pages/getstarted";
import { useAuth } from "../../services/auth";

type Props = {
  task: Task;
  dismissedSteps?: {
    [key: string]: boolean;
  };
  setDismissedSteps: (value: { [key: string]: boolean }) => void;
};

export default function GetStartedCard({
  task,
  dismissedSteps,
  setDismissedSteps,
}: Props) {
  const { apiCall } = useAuth();

  const handleMarkAsComplete = async () => {
    const updatedDismissedSteps = { ...dismissedSteps, [task.title]: true };
    setDismissedSteps(updatedDismissedSteps);
    await apiCall(`/organization`, {
      method: "PUT",
      body: JSON.stringify({
        settings: {
          dismissedGettingStartedSteps: updatedDismissedSteps,
        },
      }),
    });
  };

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "#F6F7FA",
        borderRadius: "0.25rem",
        border: "1px solid rgba(0, 0, 0, 0.125)",
      }}
    >
      <div>
        <h4>{task.title}</h4>
        <p>
          {task.text}{" "}
          {task.link && task.learnMoreLink && (
            <span>
              <a href={task.link} target="_blank" rel="noreferrer">
                {task.learnMoreLink}
              </a>
            </span>
          )}
        </p>
      </div>
      <div
        className="pt-4"
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        {!task.completed && (
          <button
            type="button"
            className="btn btn-link"
            onClick={handleMarkAsComplete}
          >
            Mark as Complete
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            task.onClick(true);
          }}
        >
          {task.cta}
        </button>
      </div>
    </div>
  );
}
