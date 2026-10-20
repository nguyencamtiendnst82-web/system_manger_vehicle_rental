import { describe, test, expect } from '@jest/globals';

describe('Unit Test - Vehicle Rental', () => {

    test('UT01 - Kiem tra phep tinh tien thue xe', () => {
        const giaThueMotNgay = 300000;
        const soNgayThue = 3;

        const tongTien = giaThueMotNgay * soNgayThue;

        expect(tongTien).toBe(900000);
    });

    test('UT02 - Kiem tra so ngay thue hop le', () => {
        const soNgayThue = 5;

        expect(soNgayThue).toBeGreaterThan(0);
    });

});