import React, { FC } from "react";
import { SnapshotMetric } from "back-end/types/experiment-snapshot";
import {
  FaCheck,
  FaExclamation,
  FaExclamationTriangle,
  FaQuestion,
} from "react-icons/fa";
import { MetricInterface } from "back-end/types/metric";
import {
  isExpectedDirection,
  isStatSig,
  pValueFormatter,
} from "@/services/experiments";
import usePValueThreshold from "@/hooks/usePValueThreshold";

export function getPValueGuardrailStatus(
  expectedDirection: boolean,
  statSig: boolean
): "ok" | "warning" | "danger" | "non-significant" {
  let status: "ok" | "warning" | "danger" | "non-significant" =
    "non-significant";
  if (expectedDirection && statSig) {
    status = "ok";
  } else if (!expectedDirection && !statSig) {
    status = "warning";
  } else if (!expectedDirection && statSig) {
    status = "danger";
  }
  return status;
}

const PValueGuardrailResults: FC<{
  stats: SnapshotMetric;
  metric: MetricInterface;
  enoughData: boolean;
  className?: string;
}> = ({ stats, metric, enoughData, className = "" }) => {
  const pValueThreshold = usePValueThreshold();

  const expectedDirection = isExpectedDirection(stats, metric);
  const statSig = isStatSig(
    stats.pValueAdjusted ?? stats?.pValue ?? 1,
    pValueThreshold
  );
  const status = getPValueGuardrailStatus(expectedDirection, statSig);

  return (
    <td className={`guardrail result-number ${className}`}>
      <div
        className={`variation ${status} d-flex justify-content-end align-items-center`}
      >
        {stats && enoughData ? (
          <>
            <span style={{ fontSize: 16 }}>
              {status === "ok" && <FaCheck className="mr-1" />}
              {status === "warning" && (
                <FaExclamationTriangle className="mr-1" />
              )}
              {status === "danger" && <FaExclamation className="mr-1" />}
              {status === "non-significant" && <FaQuestion className="mr-1" />}
            </span>
            <div
              className="d-inline-block ml-2"
              style={{ width: 50, lineHeight: "14px" }}
            >
              <div>
                {expectedDirection ? "Better" : "Worse"}
                {statSig ? "" : "?"}
              </div>
              <div>
                ({pValueFormatter(stats.pValueAdjusted ?? stats.pValue ?? 1)})
              </div>
            </div>
          </>
        ) : (
          <span
            className="text-gray font-weight-normal"
            style={{ fontSize: 11 }}
          >
            not enough data
          </span>
        )}
      </div>
    </td>
  );
};
export default PValueGuardrailResults;
