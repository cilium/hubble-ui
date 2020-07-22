import React, { memo, useCallback, useMemo } from 'react';
import classnames from 'classnames';

import {
  FlowsFilterDirection,
  FlowsFilterEntry,
  FlowsFilterKind,
  Flow,
} from '~/domain/flows';
import { TCPFlags, Verdict } from '~/domain/hubble';
import { KV } from '~/domain/misc';

import { FiltersProps } from './general';

import css from './styles.scss';
import { Labels } from '~/domain/labels';

export interface BodyFiltersProps extends FiltersProps {
  filterDirection?: FlowsFilterDirection;
}

export interface LabelsBodyProps extends BodyFiltersProps {
  labels: KV[];
}

export const LabelsBody = memo<LabelsBodyProps>(
  function FlowsTableSidebarLabelsBody(props) {
    return (
      <div className={css.labels}>
        {props.labels.map(label => {
          return (
            <LabelsBodyItem
              key={`${label.key}=${label.value}`}
              label={label}
              dataFilters={props.dataFilters}
              filterDirection={props.filterDirection}
              onSelectFilters={props.onSelectFilters}
            />
          );
        })}
      </div>
    );
  },
);

export interface LabelsBodyItemProps extends BodyFiltersProps {
  label: KV;
}

export const LabelsBodyItem = memo<LabelsBodyItemProps>(
  function FlowsTableSidebarLabelsBodyItem(props) {
    const isSelected = useMemo(() => {
      let concatedLabel = props.label.key + '=';
      if (props.label.value) concatedLabel += props.label.value;

      if (!props.dataFilters?.filters) return false;

      return props.dataFilters.filters.some(filter => {
        return (
          filter.kind === FlowsFilterKind.Label &&
          filter.direction === props.filterDirection &&
          filter.query === concatedLabel
        );
      });
    }, [props.dataFilters, props.label, props.filterDirection]);

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        filters: isSelected
          ? []
          : [
              new FlowsFilterEntry({
                kind: FlowsFilterKind.Label,
                direction: props.filterDirection ?? FlowsFilterDirection.Both,
                query: `${props.label.key}=${props.label.value}`,
              }),
            ],
      });
    }, [props.onSelectFilters, props.label, isSelected]);

    const className = classnames(css.label, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
    });

    let title = Labels.normalizeKey(props.label.key);
    if (props.label.value) {
      title += `=${props.label.value}`;
    }

    return (
      <span className={className} onClick={onClick}>
        {title}
      </span>
    );
  },
);

export interface TCPFlagsBodyProps extends BodyFiltersProps {
  flags: Array<keyof TCPFlags>;
}

export const TCPFlagsBody = memo<TCPFlagsBodyProps>(
  function FlowsTableSidebarTCPFlagsBody(props) {
    return (
      <div className={css.tcpFlags}>
        {props.flags.map(flag => (
          <TCPFlagsBodyItem
            key={flag}
            flag={flag}
            dataFilters={props.dataFilters}
            filterDirection={props.filterDirection}
            onSelectFilters={props.onSelectFilters}
          />
        ))}
      </div>
    );
  },
);

export interface TCPFlagsItemProps extends BodyFiltersProps {
  flag: keyof TCPFlags;
}

export const TCPFlagsBodyItem = memo<TCPFlagsItemProps>(
  function FlowsTableSidebarTCPFlagsBodyItem(props) {
    const isSelected = useMemo(() => {
      if (!props.dataFilters?.filters) return false;

      return props.dataFilters.filters.some(filter => {
        return (
          filter.kind === FlowsFilterKind.TCPFlag &&
          filter.direction === props.filterDirection &&
          filter.query === props.flag
        );
      });
    }, [props.dataFilters, props.flag, props.filterDirection]);

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        filters: isSelected
          ? []
          : [
              new FlowsFilterEntry({
                kind: FlowsFilterKind.TCPFlag,
                direction: props.filterDirection ?? FlowsFilterDirection.Both,
                query: props.flag,
              }),
            ],
      });
    }, [props.onSelectFilters, props.flag, isSelected]);

    const className = classnames(css.tcpFlag, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.flag.toLocaleUpperCase()}
      </span>
    );
  },
);

export interface VerdictItemProps extends FiltersProps {
  verdict: Verdict;
}

export const VerdictBodyItem = memo<VerdictItemProps>(
  function FlowsTableSidebarVerdictBodyItem(props) {
    const isSelected = props.verdict === props.dataFilters?.verdict;

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        verdict: isSelected ? null : props.verdict,
      });
    }, [props.onSelectFilters, props.verdict, isSelected]);

    const className = classnames(css.verdict, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
      [css.forwardedVerdict]: props.verdict === Verdict.Forwarded,
      [css.droppedVerdict]: props.verdict === Verdict.Dropped,
    });

    return (
      <span className={className} onClick={onClick}>
        {Flow.getVerdictLabel(props.verdict)}
      </span>
    );
  },
);

export interface IPItemProps extends BodyFiltersProps {
  ip: string;
}

export const IPBodyItem = memo<IPItemProps>(
  function FlowsTableSidebarIPBodyItem(props) {
    const isSelected = useMemo(() => {
      if (!props.dataFilters?.filters) return false;

      return props.dataFilters.filters.some(filter => {
        return (
          filter.kind === FlowsFilterKind.Ip &&
          filter.direction === props.filterDirection &&
          filter.query === props.ip
        );
      });
    }, [props.dataFilters, props.ip, props.filterDirection]);

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        filters: isSelected
          ? []
          : [
              new FlowsFilterEntry({
                kind: FlowsFilterKind.Ip,
                direction: props.filterDirection ?? FlowsFilterDirection.Both,
                query: props.ip,
              }),
            ],
      });
    }, [props.onSelectFilters, props.ip, isSelected]);

    const className = classnames(css.ip, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.ip}
      </span>
    );
  },
);

export interface DnsItemProps extends BodyFiltersProps {
  dns: string;
}

export const DnsBodyItem = memo<DnsItemProps>(
  function FlowsTableSidebarDnsBodyItem(props) {
    const isSelected = useMemo(() => {
      if (!props.dataFilters?.filters) return false;

      return props.dataFilters.filters.some(filter => {
        return (
          filter.kind === FlowsFilterKind.Dns &&
          filter.direction === props.filterDirection &&
          filter.query === props.dns
        );
      });
    }, [props.dataFilters, props.dns, props.filterDirection]);

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        filters: isSelected
          ? []
          : [
              new FlowsFilterEntry({
                kind: FlowsFilterKind.Dns,
                direction: props.filterDirection ?? FlowsFilterDirection.Both,
                query: props.dns,
              }),
            ],
      });
    }, [props.onSelectFilters, props.dns, isSelected]);

    const className = classnames(css.dns, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.dns}
      </span>
    );
  },
);

export interface IdentityItemProps extends BodyFiltersProps {
  identity: number;
}

export const IdentityBodyItem = memo<IdentityItemProps>(
  function FlowsTableSidebarIdentityBodyItem(props) {
    const isSelected = useMemo(() => {
      if (!props.dataFilters?.filters) return false;

      return props.dataFilters.filters.some(filter => {
        return (
          filter.kind === FlowsFilterKind.Identity &&
          filter.direction === props.filterDirection &&
          filter.query === String(props.identity)
        );
      });
    }, [props.dataFilters, props.identity, props.filterDirection]);

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        filters: isSelected
          ? []
          : [
              new FlowsFilterEntry({
                kind: FlowsFilterKind.Identity,
                direction: props.filterDirection ?? FlowsFilterDirection.Both,
                query: String(props.identity),
              }),
            ],
      });
    }, [props.onSelectFilters, props.identity, isSelected]);

    const className = classnames(css.identity, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.identity}
      </span>
    );
  },
);

export interface PodItemProps extends BodyFiltersProps {
  pod: string;
}

export const PodBodyItem = memo<PodItemProps>(
  function FlowsTableSidebarPodBodyItem(props) {
    const isSelected = useMemo(() => {
      if (!props.dataFilters?.filters) return false;

      return props.dataFilters.filters.some(filter => {
        return (
          filter.kind === FlowsFilterKind.Pod &&
          filter.direction === props.filterDirection &&
          filter.query === String(props.pod)
        );
      });
    }, [props.dataFilters, props.pod, props.filterDirection]);

    const onClick = useCallback(() => {
      props.onSelectFilters?.({
        filters: isSelected
          ? []
          : [
              new FlowsFilterEntry({
                kind: FlowsFilterKind.Pod,
                direction: props.filterDirection ?? FlowsFilterDirection.Both,
                query: String(props.pod),
              }),
            ],
      });
    }, [props.onSelectFilters, props.pod, isSelected]);

    const className = classnames(css.podd, {
      [css.clickable]: !!props.onSelectFilters,
      [css.selected]: isSelected,
    });

    return (
      <span className={className} onClick={onClick}>
        {props.pod}
      </span>
    );
  },
);
