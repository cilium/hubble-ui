import React, { memo, useCallback } from 'react';
import classnames from 'classnames';

import { FilterDirection } from '~/domain/filtering';
import { TCPFlagName, Verdict, PodSelector } from '~/domain/hubble';
import { KV } from '~/domain/misc';
import * as verdictHelpers from '~/domain/helpers/verdict';

import css from './styles.scss';
import { Labels } from '~/domain/labels';

export interface DirectionProps {
  filterDirection?: FilterDirection;
}

export interface LabelsEntryProps extends DirectionProps {
  labels: KV[];
  selected: Set<string>;
  onClick: (label: KV) => void;
}

export const LabelsEntry = memo<LabelsEntryProps>(function FlowsTableSidebarLabelsEntry(props) {
  return (
    <div className={css.labels}>
      {props.labels.map(label => {
        const isSelected = props.selected.has(Labels.concatKV(label));

        return (
          <LabelsEntryItem
            key={Labels.concatKV(label)}
            label={label}
            onClick={props.onClick}
            isSelected={isSelected}
          />
        );
      })}
    </div>
  );
});

export interface LabelsEntryItemProps extends DirectionProps {
  label: KV;
  isSelected: boolean;
  onClick: (label: KV) => void;
}

export const LabelsEntryItem = memo<LabelsEntryItemProps>(
  function FlowsTableSidebarLabelsEntryItem(props) {
    const onClick = useCallback(() => {
      props.onClick?.(props.label);
    }, [props.label, props.onClick]);

    const className = classnames(css.label, {
      [css.clickable]: !!props.onClick,
      [css.selected]: props.isSelected,
    });

    const title = Labels.concatKV(props.label, true);

    return (
      <span className={className} onClick={onClick}>
        {title}
      </span>
    );
  },
);

export interface TCPFlagsEntryProps {
  flags: Array<TCPFlagName>;
  filterDirection?: FilterDirection;
  selected?: Set<TCPFlagName>;
  onClick?: (flag: TCPFlagName) => void;
}

export const TCPFlagsEntry = memo<TCPFlagsEntryProps>(
  function FlowsTableSidebarTCPFlagsEntry(props) {
    return (
      <div className={css.tcpFlags}>
        {props.flags.map(flag => {
          const isSelected = props.selected ? props.selected.has(flag) : false;
          const onClick = () => {
            props.onClick?.(flag);
          };

          return (
            <TCPFlagsEntryItem
              key={flag}
              flag={flag}
              isSelected={isSelected}
              filterDirection={props.filterDirection}
              onClick={onClick}
            />
          );
        })}
      </div>
    );
  },
);

export interface TCPFlagsItemProps extends DirectionProps {
  flag: TCPFlagName;
  filterDirection?: FilterDirection;
  isSelected: boolean;
  onClick?: () => void;
}

export const TCPFlagsEntryItem = memo<TCPFlagsItemProps>(
  function FlowsTableSidebarTCPFlagsEntryItem(props) {
    const onClick = useCallback(() => {
      props.onClick?.();
    }, [props.onClick]);

    const className = classnames(css.tcpFlag, {
      [css.clickable]: !!props.onClick,
      [css.selected]: props.isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.flag.toLocaleUpperCase()}
      </span>
    );
  },
);

export interface VerdictEntryProps {
  verdict: Verdict;
  isSelected: boolean;
  onClick?: () => void;
}

export const VerdictEntry = memo<VerdictEntryProps>(function FlowsTableSidebarVerdictEntry(props) {
  const className = classnames(css.verdict, {
    [css.clickable]: !!props.onClick,
    [css.selected]: props.isSelected,
    [css.forwardedVerdict]: props.verdict === Verdict.Forwarded,
    [css.droppedVerdict]: props.verdict === Verdict.Dropped,
    [css.auditVerdict]: props.verdict === Verdict.Audit,
  });

  const onClick = useCallback(() => {
    props.onClick?.();
  }, [props.onClick]);

  return (
    <span className={className} onClick={props.onClick}>
      {verdictHelpers.toString(props.verdict)}
    </span>
  );
});

export interface IPItemProps {
  ip: string;
  isSelected: boolean;
  onClick?: () => void;
}

export const IPEntry = memo<IPItemProps>(function FlowsTableSidebarIPEntry(props) {
  const onClick = useCallback(() => {
    props.onClick?.();
  }, [props.onClick]);

  const className = classnames(css.ip, {
    [css.clickable]: !!props.onClick,
    [css.selected]: props.isSelected,
  });

  return (
    <span className={className} onClick={onClick}>
      {props.ip}
    </span>
  );
});

export interface DnsItemProps {
  dns: string;
  isSelected: boolean;
  onClick?: () => void;
}

export const DnsBodyItem = memo<DnsItemProps>(function FlowsTableSidebarDnsBodyItem(props) {
  const onClick = useCallback(() => {
    props.onClick?.();
  }, [props.onClick]);

  const className = classnames(css.dns, {
    [css.clickable]: !!props.onClick,
    [css.selected]: props.isSelected,
  });

  return (
    <span className={className} onClick={onClick}>
      {props.dns}
    </span>
  );
});

export interface IdentityItemProps {
  identity: number;
  isSelected: boolean;
  onClick?: () => void;
}

export const IdentityEntry = memo<IdentityItemProps>(
  function FlowsTableSidebarIdentityBodyItem(props) {
    const onClick = useCallback(() => {
      props.onClick?.();
    }, [props.onClick]);

    const className = classnames(css.identity, {
      [css.clickable]: !!props.onClick,
      [css.selected]: props.isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.identity}
      </span>
    );
  },
);

export interface PodItemProps {
  podSelector: PodSelector;
  isSelected: boolean;
  onClick?: (_: PodSelector) => void;
}

export const PodEntry = memo<PodItemProps>(function FlowsTableSidebarPodEntry(props) {
  const onClick = useCallback(() => {
    props.onClick?.(props.podSelector);
  }, [props.podSelector, props.onClick]);

  const className = classnames(css.podd, {
    [css.clickable]: !!props.onClick,
    [css.selected]: props.isSelected,
  });

  return (
    <span className={className} onClick={onClick}>
      {props.podSelector.pod}
    </span>
  );
});
