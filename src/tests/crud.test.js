import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock Prisma thay cho cơ sở dữ liệu thật; các lời gọi được ghi lại để kiểm tra.
// MODULES dùng một vòng lặp để chạy cùng bộ CRUD cho đủ 9 bảng.
// =====================================================
// UNIT TEST TANG CRUD (src/crud/*)
// Gia lap Prisma, khong ket noi MySQL that.
// Kiem tra moi ham goi dung model, dung dieu kien where/orderBy/data.
// =====================================================

const MODELS = [
    'xe', 'hop_dong', 'khach_hang', 'nhan_vien', 'loai_xe',
    'thanh_toan', 'hoan_tien', 'bao_tri', 'tinh_trang_tra_xe',
];
const prisma = {};
for (const model of MODELS) {
    prisma[model] = {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };
}

jest.unstable_mockModule('../prismaClient.js', () => ({ prisma }));

const crud = await import('../crud/index.js');

beforeEach(() => {
    jest.resetAllMocks();
});

// Moi module: ten module, ten model Prisma, ten khoa chinh
const MODULES = [
    ['xe', 'xe', 'maXe'],
    ['hopDong', 'hop_dong', 'maHD'],
    ['khachHang', 'khach_hang', 'maKH'],
    ['nhanVien', 'nhan_vien', 'maNV'],
    ['loaiXe', 'loai_xe', 'maLoaiXe'],
    ['thanhToan', 'thanh_toan', 'maTT'],
    ['hoanTien', 'hoan_tien', 'maHT'],
    ['baoTri', 'bao_tri', 'maBT'],
    ['tinhTrangTraXe', 'tinh_trang_tra_xe', 'maTinhTrang'],
];

// Nhóm này kiểm tra: CRUD - index.js gom du 9 module.
describe('CRUD - index.js gom du 9 module', () => {
    // Mục tiêu: kiểm tra "CR00 - Export du 9 module, moi module co create/getAll/getById/update/remove" | Mong đợi: trả về kết quả đúng.
    test('CR00 - Export du 9 module, moi module co create/getAll/getById/update/remove', () => {
        expect(Object.keys(crud).sort()).toEqual(MODULES.map(([name]) => name).sort());
        for (const [name] of MODULES) {
            for (const fn of ['create', 'getAll', 'getById', 'update', 'remove']) {
                expect(typeof crud[name][fn]).toBe('function');
            }
        }
    });
});

// ----- 5 ham chuan cua tung module: moi module 1 test -----
for (const [name, model, pk] of MODULES) {
    // Nhóm này kiểm tra: CRUD - module (model).
    describe(`CRUD - ${name} (${model})`, () => {
        // Mục tiêu: kiểm tra "CR01 - module: create / getAll / getById / update / remove goi dung model va khoa chinh khóa chính" | Mong đợi: gọi Prisma với đúng dữ liệu.
        test(`CR01 - ${name}: create / getAll / getById / update / remove goi dung model va khoa chinh ${pk}`, async () => {
            const m = prisma[model];
            const mod = crud[name];

            m.create.mockResolvedValue({ [pk]: 1 });
            expect(await mod.create({ ghiChu: 'x' })).toEqual({ [pk]: 1 });
            expect(m.create).toHaveBeenCalledWith({ data: { ghiChu: 'x' } });

            m.findMany.mockResolvedValue([]);
            await mod.getAll();
            expect(m.findMany).toHaveBeenLastCalledWith({ orderBy: { [pk]: 'asc' } });
            await mod.getAll({ take: 3, orderBy: { [pk]: 'desc' } }); // options ghi de orderBy
            expect(m.findMany).toHaveBeenLastCalledWith({ take: 3, orderBy: { [pk]: 'desc' } });

            m.findUnique.mockResolvedValue({ [pk]: 5 });
            await mod.getById(5);
            expect(m.findUnique).toHaveBeenLastCalledWith({ where: { [pk]: 5 } });
            await mod.getById(5, { include: { x: true } });
            expect(m.findUnique).toHaveBeenCalledWith({ where: { [pk]: 5 }, include: { x: true } });

            m.update.mockResolvedValue({});
            await mod.update(5, { ghiChu: 'moi' });
            expect(m.update).toHaveBeenCalledWith({ where: { [pk]: 5 }, data: { ghiChu: 'moi' } });

            m.delete.mockResolvedValue({});
            await mod.remove(5);
            expect(m.delete).toHaveBeenCalledWith({ where: { [pk]: 5 } });
        });
    });
}

// Nhóm này kiểm tra: CRUD - loi tu Prisma.
describe('CRUD - loi tu Prisma', () => {
    // Mục tiêu: kiểm tra "CR02 - Loi rang buoc (khoa ngoai/trung) cua Prisma duoc nem ra nguyen ven o moi module" | Mong đợi: báo lỗi: Unique constraint failed.
    test('CR02 - Loi rang buoc (khoa ngoai/trung) cua Prisma duoc nem ra nguyen ven o moi module', async () => {
        for (const [name, model] of MODULES) {
            prisma[model].create.mockRejectedValue(new Error('Unique constraint failed'));
            prisma[model].delete.mockRejectedValue(new Error('Foreign key constraint failed'));
            await expect(crud[name].create({})).rejects.toThrow('Unique constraint failed');
            await expect(crud[name].remove(1)).rejects.toThrow('Foreign key constraint failed');
        }
    });
});

// ----- Ham rieng cua tung module -----
// Nhóm này kiểm tra: CRUD - ham tim kiem/loc rieng.
describe('CRUD - ham tim kiem/loc rieng', () => {
    // Mục tiêu: kiểm tra "CR03 - xe.getByLicensePlate tim theo bienSoXe, kem loai xe" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR03 - xe.getByLicensePlate tim theo bienSoXe, kem loai xe', async () => {
        await crud.xe.getByLicensePlate('43A-12345');
        expect(prisma.xe.findUnique).toHaveBeenCalledWith({
            where: { bienSoXe: '43A-12345' },
            include: { loai_xe: true },
        });
    });

    // Mục tiêu: kiểm tra "CR04 - xe.getByStatus loc theo trang thai, kem loai xe, sap theo maXe" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR04 - xe.getByStatus loc theo trang thai, kem loai xe, sap theo maXe', async () => {
        await crud.xe.getByStatus('SAN_SANG');
        expect(prisma.xe.findMany).toHaveBeenCalledWith({
            where: { trangThai: 'SAN_SANG' },
            include: { loai_xe: true },
            orderBy: { maXe: 'asc' },
        });
    });

    // Mục tiêu: kiểm tra "CR05 - xe.updateStatus chi doi trangThai" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR05 - xe.updateStatus chi doi trangThai', async () => {
        await crud.xe.updateStatus(3, 'DANG_BAO_TRI');
        expect(prisma.xe.update).toHaveBeenCalledWith({ where: { maXe: 3 }, data: { trangThai: 'DANG_BAO_TRI' } });
    });

    // Mục tiêu: kiểm tra "CR06 - khachHang.getByCCCD tim theo CCCD" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR06 - khachHang.getByCCCD tim theo CCCD', async () => {
        await crud.khachHang.getByCCCD('201234567890');
        expect(prisma.khach_hang.findUnique).toHaveBeenCalledWith({ where: { CCCD: '201234567890' } });
    });

    // Mục tiêu: kiểm tra "CR07 - khachHang.searchByName tim theo ten chua tu khoa" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR07 - khachHang.searchByName tim theo ten chua tu khoa', async () => {
        await crud.khachHang.searchByName('Nguyen');
        expect(prisma.khach_hang.findMany).toHaveBeenCalledWith({
            where: { hoTen: { contains: 'Nguyen' } },
            orderBy: { maKH: 'asc' },
        });
    });

    // Mục tiêu: kiểm tra "CR08 - hopDong.getDetail kem khach hang, xe, nhan vien, thanh toan, hoan tien, tinh trang tra xe" | Mong đợi: trả về kết quả đúng.
    test('CR08 - hopDong.getDetail kem khach hang, xe, nhan vien, thanh toan, hoan tien, tinh trang tra xe', async () => {
        await crud.hopDong.getDetail(7);
        const arg = prisma.hop_dong.findUnique.mock.calls[0][0];
        expect(arg.where).toEqual({ maHD: 7 });
        for (const quanHe of ['khach_hang', 'xe', 'nhan_vien', 'thanh_toan', 'hoan_tien', 'tinh_trang_tra_xe']) {
            expect(arg.include[quanHe]).toBe(true);
        }
    });

    // Mục tiêu: kiểm tra "CR09 - hopDong.getByCustomer: moi nhat truoc, kem xe" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR09 - hopDong.getByCustomer: moi nhat truoc, kem xe', async () => {
        await crud.hopDong.getByCustomer(2);
        expect(prisma.hop_dong.findMany).toHaveBeenCalledWith({
            where: { maKH: 2 },
            include: { xe: true },
            orderBy: { ngayThue: 'desc' },
        });
    });

    // Mục tiêu: kiểm tra "CR10 - hopDong.getByStatus loc theo trang thai, kem khach hang va xe" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR10 - hopDong.getByStatus loc theo trang thai, kem khach hang va xe', async () => {
        await crud.hopDong.getByStatus('DANG_THUE');
        expect(prisma.hop_dong.findMany).toHaveBeenCalledWith({
            where: { trangThai: 'DANG_THUE' },
            include: { khach_hang: true, xe: true },
            orderBy: { maHD: 'asc' },
        });
    });

    // Mục tiêu: kiểm tra "CR11 - thanhToan.getByContract sap theo ngayTT tang dan" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR11 - thanhToan.getByContract sap theo ngayTT tang dan', async () => {
        await crud.thanhToan.getByContract(4);
        expect(prisma.thanh_toan.findMany).toHaveBeenCalledWith({ where: { maHD: 4 }, orderBy: { ngayTT: 'asc' } });
    });

    // Mục tiêu: kiểm tra "CR12 - hoanTien.getByContract" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR12 - hoanTien.getByContract', async () => {
        await crud.hoanTien.getByContract(9);
        expect(prisma.hoan_tien.findMany).toHaveBeenCalledWith({ where: { maHD: 9 }, orderBy: { maHT: 'asc' } });
    });

    // Mục tiêu: kiểm tra "CR13 - baoTri.getByVehicle: phieu moi nhat truoc" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR13 - baoTri.getByVehicle: phieu moi nhat truoc', async () => {
        await crud.baoTri.getByVehicle(8);
        expect(prisma.bao_tri.findMany).toHaveBeenCalledWith({ where: { maXe: 8 }, orderBy: { maBT: 'desc' } });
    });

    // Mục tiêu: kiểm tra "CR14 - tinhTrangTraXe.getByContract" | Mong đợi: gọi Prisma với đúng dữ liệu.
    test('CR14 - tinhTrangTraXe.getByContract', async () => {
        await crud.tinhTrangTraXe.getByContract(6);
        expect(prisma.tinh_trang_tra_xe.findMany).toHaveBeenCalledWith({
            where: { maHD: 6 },
            orderBy: { maTinhTrang: 'asc' },
        });
    });
});
