# Phase 12 Resource Constraint Validation

- Timestamp (UTC): 2026-02-28T09:02:06Z
- Compose constraints: present
- docker stats sample: k8s_storage-provisioner_storage-provisioner_kube-system_bb9fc654-52f6-4b79-9b7c-495d9c32b472_6 13.22MiB / 7.653GiB 0.00%
k8s_kube-scheduler_kube-scheduler-docker-desktop_kube-system_b44739859c757a4712b786569a89a1f3_14 26.43MiB / 7.653GiB 1.01%
k8s_vpnkit-controller_vpnkit-controller_kube-system_7947e0c3-977b-4f84-b16c-1d8704eadbd4_0 12.04MiB / 7.653GiB 0.00%
k8s_coredns_coredns-66bc5c9577-qhw9j_kube-system_434e2b64-256c-4f81-9197-fcd7320eb300_0 20MiB / 170MiB 0.15%
k8s_coredns_coredns-66bc5c9577-dgxk9_kube-system_1d417d0a-abc0-4d5c-a50d-96e5f8574fe0_0 21.72MiB / 170MiB 0.17%
k8s_kube-proxy_kube-proxy-n4kt8_kube-system_9c0468ba-dc60-465a-8542-db3aeb80aaa4_0 21.94MiB / 7.653GiB 0.03%
k8s_POD_vpnkit-controller_kube-system_7947e0c3-977b-4f84-b16c-1d8704eadbd4_1 500KiB / 7.653GiB 0.00%
k8s_POD_coredns-66bc5c9577-dgxk9_kube-system_1d417d0a-abc0-4d5c-a50d-96e5f8574fe0_1 500KiB / 7.653GiB 0.00%
k8s_POD_storage-provisioner_kube-system_bb9fc654-52f6-4b79-9b7c-495d9c32b472_1 500KiB / 7.653GiB 0.00%
k8s_POD_coredns-66bc5c9577-qhw9j_kube-system_434e2b64-256c-4f81-9197-fcd7320eb300_1 500KiB / 7.653GiB 0.00%
k8s_POD_kube-proxy-n4kt8_kube-system_9c0468ba-dc60-465a-8542-db3aeb80aaa4_1 308KiB / 7.653GiB 0.00%
k8s_etcd_etcd-docker-desktop_kube-system_0b753cb7812d40a401f3a8f63b18f779_8 88.34MiB / 7.653GiB 0.79%
k8s_kube-controller-manager_kube-controller-manager-docker-desktop_kube-system_10b0d524eef4b9a12d5827ba17a36f4f_8 127MiB / 7.653GiB 1.04%
k8s_kube-apiserver_kube-apiserver-docker-desktop_kube-system_647244f1c75810d936baf4253b7903ef_8 297.1MiB / 7.653GiB 1.88%
k8s_POD_etcd-docker-desktop_kube-system_0b753cb7812d40a401f3a8f63b18f779_8 188KiB / 7.653GiB 0.00%
k8s_POD_kube-scheduler-docker-desktop_kube-system_b44739859c757a4712b786569a89a1f3_8 184KiB / 7.653GiB 0.00%
k8s_POD_kube-controller-manager-docker-desktop_kube-system_10b0d524eef4b9a12d5827ba17a36f4f_8 680KiB / 7.653GiB 0.00%
k8s_POD_kube-apiserver-docker-desktop_kube-system_647244f1c75810d936baf4253b7903ef_8 184KiB / 7.653GiB 0.00%

## Result

PASS - resource limits are encoded for all required services.
